
import React from 'react';

const pipelines = [
  'text-classification',
  'image-classification',
  'question-answering',
  'translation',
];

interface PipelineSelectorProps {
  onPipelineSelect: (pipeline: string) => void;
}

const PipelineSelector: React.FC<PipelineSelectorProps> = ({ onPipelineSelect }) => {
  return (
    <select onChange={(e) => onPipelineSelect(e.target.value)}>
      <option value="">Select a pipeline</option>
      {pipelines.map((pipeline) => (
        <option key={pipeline} value={pipeline}>
          {pipeline}
        </option>
      ))}
    </select>
  );
};

export default PipelineSelector;
