/* eslint-disable no-restricted-globals */
import { pipeline } from '@huggingface/transformers';

class MyZeroShotClassificationPipeline {
  static task = 'zero-shot-classification';
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
  const { text, labels, model } = event.data;
  if (!model) {
    self.postMessage({
      status: 'error',
      output: 'No model provided'
    });
    return;
  }

  // Retrieve the pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  const classifier = await MyZeroShotClassificationPipeline.getInstance(model, (x) => {
    // We also add a progress callback to the pipeline so that we can
    // track model loading.
    self.postMessage({ status: 'progress', output: x });
  });
  const split = text.split('\n');
  for (const line of split) {
    const output = await classifier(line, labels, {
      hypothesis_template: 'This text is about {}.',
      multi_label: true
    });
    // Send the output back to the main thread
    self.postMessage({ status: 'output', output });
  }
  // Send the output back to the main thread
  self.postMessage({ status: 'complete' });
});
