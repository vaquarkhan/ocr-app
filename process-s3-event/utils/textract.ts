import { Logger } from '@aws-lambda-powertools/logger';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

export default class TextractCustomClient {
    private _logger = new Logger({ serviceName: "TextractCustomClient" });
    private _client: TextractClient;

    constructor() {
        this._client = new TextractClient({ region: process.env.REGION });
    }

    async analyzeDocument(bucketName: string, objectName: string) {
        const features = ['FORMS'];
        const params = {
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
        this._logger.info(`Analyzed object ${objectName} through textract`)
        return data;
    }
}
