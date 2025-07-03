import React from 'react';

interface CodeExporterProps {
  code: string;
}

const CodeExporter: React.FC<CodeExporterProps> = ({ code }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-medium">Code</h2>
      <pre className="bg-gray-100 p-2 rounded">{code}</pre>
    </div>
  );
};

export default CodeExporter;
