export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'error';

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface BatchItem {
  id: string;
  original: ImageFile;
  status: ProcessingStatus;
  processedBase64?: string;
  processedMimeType?: string;
  error?: string;
}

export interface EditorState {
  brightness: number;
  contrast: number;
  zoom: number;
}