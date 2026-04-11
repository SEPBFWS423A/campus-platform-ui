export interface GeneralDocument {
  id: number;
  displayName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface UploadGeneralDocumentRequest {
  displayName: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
  fileSize?: number;
}
