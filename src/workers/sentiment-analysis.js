/* eslint-disable no-restricted-globals */
import { pipeline } from "@huggingface/transformers";

class MyTextClassificationPipeline {
  static task = "text-classification";
  static model = "Xenova/bert-base-multilingual-uncased-sentiment";
  static instance = null;

  static async getInstance(progress_callback = null) {
    this.instance ??= pipeline(this.task, this.model, {
      progress_callback,
    });

    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  // Retrieve the pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  const classifier = await MyTextClassificationPipeline.getInstance((x) => {
    // We also add a progress callback to the pipeline so that we can
    // track model loading.
    self.postMessage({ status: "progress", output: x });
  });

  const { text } = event.data;

  const split = text.split("\n");
  for (const line of split) {
    if (line.trim()) {
      const output = await classifier(line);
      // Send the output back to the main thread
      self.postMessage({ 
        status: "output", 
        output: {
          sequence: line,
          labels: [output[0].label],
          scores: [output[0].score]
        }
      });
    }
  }
  // Send the output back to the main thread
  self.postMessage({ status: "complete" });
});
