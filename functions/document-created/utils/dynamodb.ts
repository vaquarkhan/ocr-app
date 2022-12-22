import { Logger } from '@aws-lambda-powertools/logger';
import DynamoDB from 'aws-sdk/clients/dynamodb';

export default class DynamoCustomClient {
    private _logger = new Logger({ serviceName: "CustomDynamoClient" });
    private _table: string;
    private _docClient: DynamoDB.DocumentClient;

    constructor(table = process.env.SAMPLE_TABLE) {
        this._docClient = new DynamoDB.DocumentClient();
        this._table = String(table);
    }

    async readAll() {
        const data = await this._docClient.scan({ TableName: this._table }).promise();
        return data.Items;
    }

    async read(id: any) {
        var params = {
            TableName : this._table,
            Key: { id: id },
        };
        const data = await this._docClient.get(params).promise();
        return data.Item;
    }

    async write(item: any) {
        const params: DynamoDB.PutItemInput = {
            TableName: this._table,
            Item: item,
        };
        return this._docClient.put(params).promise();
    }

    async put(params: DynamoDB.DocumentClient.UpdateItemInput) {
        return this._docClient.update(params).promise();
    }
}