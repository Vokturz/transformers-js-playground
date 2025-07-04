/* eslint-disable no-restricted-globals */
import { pipeline } from '@huggingface/transformers';

class MyTextClassificationPipeline {
  static task = 'text-classification';
  static instance = null;

  static async getInstance(model, progress_callback = null) {
    this.instance ??= pipeline(this.task, model, {
      progress_callback
    });

    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { text, model } = event.data;
  if (!model) {
    self.postMessage({
      status: 'error',
      output: 'No model provided'
    });
    return;
  }

  // Retrieve the pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  const classifier = await MyTextClassificationPipeline.getInstance(model, (x) => {
    // We also add a progress callback to the pipeline so that we can
    // track model loading.
    self.postMessage({ status: 'progress', output: x });
  });



  const split = text.split('\n');
  for (const line of split) {
    if (line.trim()) {
      const output = await classifier(line);
      // Send the output back to the main thread
      self.postMessage({
        status: 'output',
        output: {
          sequence: line,
          labels: [output[0].label],
          scores: [output[0].score]
        }
      });
    }
  }
  // Send the output back to the main thread
  self.postMessage({ status: 'complete' });
});
