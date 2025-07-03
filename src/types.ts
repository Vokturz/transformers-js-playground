export interface Section {
  title: string;
  items: string[];
}

export interface ClassificationOutput {
  sequence: string;
  labels: string[];
  scores: number[];
}



export interface WorkerMessage {
  status: 'initiate' | 'ready' | 'output' | 'complete';
  output?: any;
}

export interface ZeroShotWorkerInput {
  text: string;
  labels: string[];
}


export interface SentimentAnalysisWorkerInput {
  text: string;
}

export type AppStatus = 'idle' | 'loading' | 'processing';
