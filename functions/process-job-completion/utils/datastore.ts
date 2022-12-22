import { Logger } from '@aws-lambda-powertools/logger';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import DynamoCustomClient from './dynamodb';

export default class DataStore {
    private _logger = new Logger({ serviceName: 'DataStore' });
    private _client: DynamoCustomClient;
    private _tableName: string;

    constructor(table = process.env.SAMPLE_TABLE) {
        this._client = new DynamoCustomClient(table);
        this._tableName = String(table);
    }

    async createDocument(documentId: string, bucketName: string, objectName: string) {
        // Create new record in documents table in dynmodb
        var params: DynamoDB.DocumentClient.UpdateItemInput = {
            ExpressionAttributeValues: {
                ':bucketNameValue': bucketName,
                ':objectNameValue': objectName,
                ':documentstatusValue': 'IN_PROGRESS',
                ':documentCreatedOnValue': new Date().toISOString(),
            },
            UpdateExpression:
                'SET bucketName = :bucketNameValue, objectName = :objectNameValue, documentStatus = :documentstatusValue, documentCreatedOn = :documentCreatedOnValue',
            Key: {
                documentId: documentId,
            },
            TableName: this._tableName,
        };
        const data = await this._client.put(params);
        this._logger.info(`Created document id ${documentId} for object ${objectName}`);
        return data;
    }

    async markDocumentCompleted(documentId: string) {
        // Create new record in documents table in dynmodb
        var params: DynamoDB.DocumentClient.UpdateItemInput = {
            ExpressionAttributeValues: {
                ':documentstatusValue': 'COMPLETED',
                ':documentCompletedOnValue': new Date().toISOString(),
            },
            UpdateExpression:
                'SET documentStatus = :documentstatusValue, documentCompletedOn = :documentCompletedOnValue',
            Key: {
                documentId: documentId,
            },
            TableName: this._tableName,
        };
        const data = await this._client.put(params);
        this._logger.info(`Updated document id ${documentId} as COMPLETED`);
        return data;
    }

    async createOutput(documentId: string, outputType: string, outputPath: string) {
        const data = await this._client.write({
            documentId,
            outputPath,
            outputType,
        });
        this._logger.info(`Created output type: ${outputType} for document id ${documentId}`);
        return data;
    }
}
