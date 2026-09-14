import React from 'react';

interface CodeExporterProps {
  code: string;
}

const CodeExporter: React.FC<CodeExporterProps> = ({ code }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Code
      </h2>
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm text-foreground">
        {code}
      </pre>
    </div>
  );
};

export default CodeExporter;
