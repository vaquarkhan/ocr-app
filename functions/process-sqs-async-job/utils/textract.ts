import { Logger } from '@aws-lambda-powertools/logger';
import {
    TextractClient,
    AnalyzeDocumentCommand,
    StartDocumentAnalysisCommand,
    StartDocumentAnalysisCommandInput,
    AnalyzeDocumentCommandInput,
} from '@aws-sdk/client-textract';

export default class TextractCustomClient {
    private _logger = new Logger({ serviceName: 'TextractCustomClient' });
    private _client: TextractClient;

    constructor() {
        this._client = new TextractClient({ region: process.env.REGION });
    }

    async analyzeDocument(bucketName: string, objectName: string) {
        const features = ['FORMS', 'TABLES'];
        const params: AnalyzeDocumentCommandInput = {
            Document: {
                S3Object: {
                    Bucket: bucketName,
                    Name: objectName,
                },
            },
            FeatureTypes: features,
        };
        const command = new AnalyzeDocumentCommand(params);

        const data = await this._client.send(command);
        this._logger.info(`Analyzed object ${objectName} through textract`);
        return data;
    }

    async startAnalyzeDocument(
        bucketName: string,
        objectName: string,
        documentId: string,
        topicArn: string,
        roleArn: string,
    ) {
        const features = ['FORMS', 'TABLES'];
        const params: StartDocumentAnalysisCommandInput = {
            ClientRequestToken: documentId,
            JobTag: documentId,
            DocumentLocation: {
                S3Object: {
                    Bucket: bucketName,
                    Name: objectName,
                },
            },
            NotificationChannel: {
                SNSTopicArn: topicArn,
                RoleArn: roleArn,
            },
            FeatureTypes: features,
        };
        this._logger.info(`Start document analysis params: ${JSON.stringify(params)}`);
        const command = new StartDocumentAnalysisCommand(params);

        const data = await this._client.send(command);
        this._logger.info(`Analyzed object ${objectName} through textract async, job id: ${data.JobId}`);
        return data;
    }
}
