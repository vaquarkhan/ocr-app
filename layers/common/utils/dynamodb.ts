import { Logger } from '@aws-lambda-powertools/logger';
import DynamoDB from 'aws-sdk/clients/dynamodb';

export default class DynamoCustomClient {
    private _logger = new Logger({ serviceName: 'CustomDynamoClient' });
    private _docClient: DynamoDB.DocumentClient;

    constructor() {
        this._docClient = new DynamoDB.DocumentClient();
    }

    async readAll(tableName: string, filterExp?: string, expVal?: Object) {
        const data = await this._docClient.scan({ TableName: tableName, FilterExpression: filterExp, ExpressionAttributeValues: expVal }).promise();
        return data;
    }

    async query(tableName: string, keyCndExp: string, expVal: Object) {
        const data = await this._docClient
            .query({ TableName: tableName, KeyConditionExpression: keyCndExp, ExpressionAttributeValues: expVal })
            .promise();
        return data;
    }

    async read(tableName: string, key: Object) {
        var params = {
            TableName: tableName,
            Key: key,
        };
        const data = await this._docClient.get(params).promise();
        return data.Item;
    }

    async write(tableName: string, item: any) {
        const params: DynamoDB.PutItemInput = {
            TableName: tableName,
            Item: item,
        };
        return this._docClient.put(params).promise();
    }

    async put(params: DynamoDB.DocumentClient.UpdateItemInput) {
        return this._docClient.update(params).promise();
    }

    async delete(params: DynamoDB.DocumentClient.DeleteItemInput) {
        return this._docClient.delete(params).promise();
    }
}
