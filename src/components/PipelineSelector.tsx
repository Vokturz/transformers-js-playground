
import React from 'react';

const pipelines = [
  'zero-shot-classification',
  'text-classification',
  'image-classification',
  'question-answering',
  'translation',
];

interface PipelineSelectorProps {
  pipeline: string;
  setPipeline: (pipeline: string) => void;
}

const PipelineSelector: React.FC<PipelineSelectorProps> = ({ pipeline, setPipeline }) => {
  return (
    <select value={pipeline} onChange={(e) => setPipeline(e.target.value)}>
      {pipelines.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
};

export default PipelineSelector;
