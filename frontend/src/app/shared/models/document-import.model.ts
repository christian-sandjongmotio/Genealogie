export interface ImportCandidate {
  reference: string;
  name: string;
  parentReference?: string;
}

export interface DocumentPreview {
  fileName: string;
  lineCount: number;
  lines: string[];
  candidates: ImportCandidate[];
}

export interface ImportResult {
  imported: number;
  linked: number;
}
