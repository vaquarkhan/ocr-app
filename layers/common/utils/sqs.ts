import { Logger } from '@aws-lambda-powertools/logger';
import SQS from 'aws-sdk/clients/sqs';

export default class SqsCustomClient {
    private _logger = new Logger({ serviceName: "SqsCustomClient" });
    private _sqs: SQS;

    constructor() {
        this._sqs = new SQS();
    }

    async send(queueUrl: string, body: Object) {
        const params = {
            MessageBody: JSON.stringify(body),
            QueueUrl: queueUrl,
            DelaySeconds: 0,
        }
        const message = await this._sqs.sendMessage(params).promise();
        this._logger.info(`Sent message to queue ${queueUrl}, message id: ${message.MessageId}`)
        return message;
    }
}
