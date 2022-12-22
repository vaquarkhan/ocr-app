export interface ITextractResultsModel {
    Message: ITextractResultsMessageModel
}


export interface ITextractResultsMessageModel {
  JobId: string;
  Status: string;
  API: string;
  JobTag: string;
  Timestamp: number;
  DocumentLocation: IDocumentLocation;
}

export interface IDocumentLocation {
  S3ObjectName: string;
  S3Bucket: string;
}