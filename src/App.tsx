import { useState } from "react";
import PipelineSelector from "./components/PipelineSelector";
import ZeroShotClassification from "./components/ZeroShotClassification";
import SentimentAnalysis from "./components/SentimentAnalysis";

function App() {
  const [pipeline, setPipeline] = useState("zero-shot-classification");

  return (
    <div className="flex flex-col h-screen w-screen p-1">
      <PipelineSelector pipeline={pipeline} setPipeline={setPipeline} />
      {pipeline === "zero-shot-classification" && <ZeroShotClassification />}
      {pipeline === "sentiment-analysis" && <SentimentAnalysis />}
    </div>
  );
}

export default App;

