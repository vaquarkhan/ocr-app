import { Logger } from '@aws-lambda-powertools/logger';
import {
    S3Client,
    PutObjectCommand,
    PutObjectCommandInput,
    CopyObjectCommand,
    CopyObjectCommandInput,
    ListObjectsV2Command,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    ObjectIdentifier,
} from '@aws-sdk/client-s3';

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
        this._logger.info(`Stored object: ${objectName} in S3`);
        return response;
    }

    async copyObject(sourceKey: string, destenationKey: string, bucket: string) {
        const params: CopyObjectCommandInput = {
            CopySource: sourceKey,
            Key: destenationKey,
            Bucket: bucket,
        };
        const command = new CopyObjectCommand(params);

        const response = await this._client.send(command);
        this._logger.info(`Moved object from: ${sourceKey} to: ${destenationKey} in S3`);
        return response;
    }

    async emptyS3Directory(bucket: string, key: string) {
        const listParams = {
            Bucket: bucket,
            Prefix: key,
        };

        const listCommand = new ListObjectsV2Command(listParams);
    
        const listedObjects = await this._client.send(listCommand);
        
        if (listedObjects) {
            if (listedObjects.Contents?.length === 0) {
                return this.deleteObject(bucket, key);
            } else if (listedObjects.Contents) {

                const keys: ObjectIdentifier[] = [];
            
                listedObjects.Contents.forEach(({ Key }) => {
                    keys.push({ Key });
                });
            
                await this.deleteObjects(bucket, keys);
            
                if (listedObjects.IsTruncated) await this.emptyS3Directory(bucket, key);
            }
        }
    
    }

    async deleteObject(bucket: string, key: string) {
        const command = new DeleteObjectCommand({ Bucket: bucket, Key: key })
        return this._client.send(command);
    }

    async deleteObjects(bucket: string, keys: ObjectIdentifier[]) {
        const command = new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys} })
        return this._client.send(command);
    }
}
