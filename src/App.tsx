// src/App.tsx
import { useState } from "react";
import PipelineSelector from "./components/PipelineSelector";
import ZeroShotClassification from "./components/ZeroShotClassification";
import TextClassification from "./components/TextClassification";

function App() {
  const [pipeline, setPipeline] = useState("zero-shot-classification");

  return (
    <div className="flex flex-col h-screen w-screen p-1">
      <PipelineSelector pipeline={pipeline} setPipeline={setPipeline} />
      {pipeline === "zero-shot-classification" && <ZeroShotClassification />}
      {pipeline === "text-classification" && <TextClassification />}
    </div>
  );
}

export default App;

