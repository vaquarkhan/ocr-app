import { Logger } from '@aws-lambda-powertools/logger';
import DynamoDB from 'aws-sdk/clients/dynamodb';

export default class CustomDynamoClient {
    private _logger = new Logger({ serviceName: "CustomDynamoClient" });
    table: string;
    docClient: DynamoDB.DocumentClient;

    constructor(table = process.env.SAMPLE_TABLE) {
        this.docClient = new DynamoDB.DocumentClient();
        this.table = String(table);
    }

    async readAll() {
        const data = await this.docClient.scan({ TableName: this.table }).promise();
        return data.Items;
    }

    async read(id: any) {
        var params = {
            TableName : this.table,
            Key: { id: id },
        };
        const data = await this.docClient.get(params).promise();
        return data.Item;
    }

    async write(item: any) {
        const params: DynamoDB.PutItemInput = {
            TableName: this.table,
            Item: item,
        };
        return this.docClient.put(params).promise();
    }

    async put(params: DynamoDB.DocumentClient.UpdateItemInput) {
        return this.docClient.update(params).promise();
    }
}