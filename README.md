---
title: Transformers.js Playground
emoji: 🌍
colorFrom: indigo
colorTo: blue
sdk: static
pinned: false
app_build_command: npm run build
app_file: dist/index.html
---

# In-Browser AI with Hugging Face Transformers.js

This project is a web-based application built with React and TypeScript that demonstrates how to run Hugging Face Transformers models directly in the browser. It leverages the power of the `transformers.js` library to perform various NLP tasks like text generation, text classification, and zero-shot classification without any server-side backend for the model inference.

The entire process, from model loading to inference, happens on the client-side, ensuring user privacy and showcasing the capabilities of modern web technologies like Web Workers and WebGPU.

-----

## ✨ Features

  * **Multiple Pipelines:** Supports several NLP tasks:
      * Text Generation
      * Text Classification
      * Zero-Shot Classification
  * **Dynamic Model Loading:** Fetches and runs compatible models directly from the Hugging Face Hub based on the selected pipeline.
  * **In-Browser Inference:** All machine learning computations are performed in the user's browser using **Hugging Face Transformers.js**. No data is sent to a server.
  * **Non-Blocking UI:** Uses **Web Workers** to run the heavy model computations in a background thread, ensuring the main UI remains responsive and smooth.
  * **Hardware Acceleration:** Leverages **WebGPU** for significantly faster model performance on supported hardware.
  * **Model Quantization:** Allows users to select different quantization levels (e.g., `fp32`, `int8`) to balance performance and precision.
  * **Modern Tech Stack:** Built with **React**, **TypeScript**, and styled with **Tailwind CSS**.

-----

## 🏗️ How It Works

The application's architecture is designed to offload heavy machine learning tasks from the main UI thread, providing a seamless user experience.

1.  **Pipeline and Model Selection:** The user first selects an NLP pipeline (e.g., "Text Generation"). The application then calls the Hugging Face Hub API to fetch a list of compatible models for that task.
2.  **Model Loading via Worker:** When the user selects a model and clicks "Load Model", the main application dispatches a message to a dedicated Web Worker.
3.  **Background Processing:** The Web Worker, running in a separate thread, receives the message. It uses the `transformers.js` library to download the model files and load the pipeline. This process can be monitored on the UI via progress updates sent from the worker.
4.  **Inference:** Once the model is loaded, the user can input text. This input is sent to the worker, which performs the inference using the loaded model and WebGPU for acceleration.
5.  **Displaying Results:** The worker sends the prediction results back to the main thread, which then updates the UI to display the output to the user.

This separation of concerns ensures that the computationally intensive work of the AI model does not freeze the user's browser.

-----

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You'll need to have Node.js and npm (or pnpm) installed on your machine.