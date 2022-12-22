import { Logger } from '@aws-lambda-powertools/logger';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';

export default class S3CustomClient {
    private _logger = new Logger({ serviceName: 'S3CustomClient' });
    private _client: S3Client;

    constructor() {
        this._client = new S3Client({ region: process.env.REGION });
    }

    async putObject(bucketName: string, objectName: string, data: any) {
        const params: PutObjectCommandInput = {
            Body: data,
            Bucket: bucketName,
            Key: objectName,
        };
        const command = new PutObjectCommand(params);

        const response = await this._client.send(command);
        this._logger.info(`Stored object ${objectName} in bucket: ${bucketName}`);
        return response;
    }
}
