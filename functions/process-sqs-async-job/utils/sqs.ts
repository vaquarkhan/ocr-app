import { Logger } from '@aws-lambda-powertools/logger';
import SQS from 'aws-sdk/clients/sqs';

// Declare some custom client just to illustrate how TS will include only used files into lambda distribution
export default class SqsCustomClient {
    private _logger = new Logger({ serviceName: "SqsCustomClient" });
    private _queue: string;
    private _sqs: SQS;

    constructor(queue: string) {
        this._sqs = new SQS();
        this._queue = queue;
    }

    async send(body: object) {
        const params = {
            MessageBody: JSON.stringify(body),
            QueueUrl: this._queue,
            DelaySeconds: 0,
        }
        return this._sqs.sendMessage(params).promise();
    }
}
