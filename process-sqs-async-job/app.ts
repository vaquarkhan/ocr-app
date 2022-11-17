import { APIGatewayProxyResult, Context, S3Event, S3EventRecord, SQSEvent, SQSRecord } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import TextractCustomClient from './utils/textract';

const logger = new Logger();

// Textract
const textractClient = new TextractCustomClient();

// SQS
// const sqsAsyncQueueUrl = String(process.env.ASYNC_QUEUE_URL);
// const sqsClient = new SqsCustomClient(sqsAsyncQueueUrl)

export async function processRecord(record: SQSRecord) {
    const { bucketName, objectName, documentId } = JSON.parse(record.body);
    return textractClient.startAnalyzeDocument(bucketName, objectName, documentId);
}

/**
 *
 * @param {APIGatewayProxyEvent} event - API Gateway Lambda Proxy Input Format
 * @param {Context} context - Lambda $context variable
 *
 * @returns {APIGatewayProxyResult} object - API Gateway Lambda Proxy Output Format
 *
 */
export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    try {
        for (const record of event.Records) {            
            logger.info(`Start processing SQS message record with message id: ${record.messageId}`);
            await processRecord(record);
        }
        response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'S3 event records processed successfully',
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