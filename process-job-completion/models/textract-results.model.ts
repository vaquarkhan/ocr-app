interface ITextractResultsModel {
    Message: ITextractResultsMessageModel
}


interface ITextractResultsMessageModel {
  JobId: string;
  Status: string;
  API: string;
  JobTag: string;
  Timestamp: number;
  DocumentLocation: IDocumentLocation;
}

interface IDocumentLocation {
  S3ObjectName: string;
  S3Bucket: string;
}