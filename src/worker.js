/* eslint-disable no-restricted-globals */
import { pipeline } from "@huggingface/transformers";

class PipelineFactory {
  static task = null;
  static model = null;
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback,
      });
    }

    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  const { task, model, input } = event.data;

  PipelineFactory.task = task;
  PipelineFactory.model = model;

  // Retrieve the pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  const pipe = await PipelineFactory.getInstance((x) => {
    // We also add a progress callback to the pipeline so that we can
    // track model loading.
    self.postMessage({ status: "progress", data: x });
  });

  // Run the pipeline
  const output = await pipe(...input);

  // Send the output back to the main thread
  self.postMessage({ status: "output", output });

  // Send the output back to the main thread
  self.postMessage({ status: "complete" });
});
