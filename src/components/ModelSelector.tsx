import React from 'react';

interface ModelSelectorProps {
  model: string;
  setModel: (model: string) => void;
  models: string[];
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, setModel, models }) => {
  return (
    <select value={model} onChange={(e) => setModel(e.target.value)}>
      {models.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
};

export default ModelSelector;
