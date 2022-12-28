import { APIGatewayProxyResult, Context, DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import SqsCustomClient from '/opt/nodejs/common/utils/sqs';

const logger = new Logger();

// SQS
const sqsAsyncQueueUrl = String(process.env.ASYNC_QUEUE_URL);
const sqsClient = new SqsCustomClient();

export async function processRecord(record: DynamoDBRecord) {
    if (record.dynamodb?.NewImage) {
        const documentId = record.dynamodb?.NewImage.documentId.S;
        const bucketName = record.dynamodb.NewImage.bucketName.S;
        const objectName = record.dynamodb.NewImage.objectName.S;
        // Send document to async queue
        await sqsClient.send(sqsAsyncQueueUrl, {
            bucketName,
            objectName,
            documentId,
        });
    } else {
        logger.error('Record has no new image');
    }
}

/**
 *
 * @param {APIGatewayProxyEvent} event - API Gateway Lambda Proxy Input Format
 *
 * @returns {APIGatewayProxyResult} object - API Gateway Lambda Proxy Output Format
 *
 */
export const lambdaHandler = async (event: DynamoDBStreamEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Event: ${JSON.stringify(event, null, 2)}`);
    let response: APIGatewayProxyResult;
    try {
        for (const record of event.Records) {
            if (record.eventName === 'INSERT' && record.dynamodb?.NewImage) {
                logger.info(`Start processing new document created: ${record.dynamodb.NewImage.documentId.S}`);
                await processRecord(record);
            }
        }
        response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'DynamoDB records processed successfully',
            }),
        };
    } catch (error) {
        // Error handling
        response = {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
        logger.error('some error happened', { error });
    }

    return response;
};
