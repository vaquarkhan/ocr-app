import { APIGatewayProxyResult, Context, S3Event, S3EventRecord } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { v4 } from 'uuid';
import DataStore from './utils/datastore';
import SqsCustomClient from './utils/sqs';

const logger = new Logger();

// DynamoDB
const docsTableName = String(process.env.DOCS_TABLE);
const documentsDataStore = new DataStore(docsTableName);

// SQS
const sqsAsyncQueueUrl = String(process.env.ASYNC_QUEUE_URL);
const sqsClient = new SqsCustomClient();

export async function processRecord(record: S3EventRecord) {
    // Fetch bucket and object name from the new S3 event record
    const bucketName = record.s3.bucket.name;
    const objectName = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // Create document with IN_PROGRESS status
    const documentId = v4(); // Generate random uuid
    await documentsDataStore.createDocument(documentId, bucketName, objectName);

    // Send document to async queue
    await sqsClient.send(sqsAsyncQueueUrl, {
        bucketName,
        objectName,
        documentId,
    });
}

/**
 *
 * @param {APIGatewayProxyEvent} event - API Gateway Lambda Proxy Input Format
 * @param {Context} context - Lambda $context variable
 *
 * @returns {APIGatewayProxyResult} object - API Gateway Lambda Proxy Output Format
 *
 */
export const lambdaHandler = async (event: S3Event, context: Context): Promise<APIGatewayProxyResult> => {
    logger.info(`Event: ${JSON.stringify(event, null, 2)}`);
    let response: APIGatewayProxyResult;
    try {
        for (const record of event.Records) {
            logger.info(`Start processing S3 event record with object key: ${record.s3.object.key}`);
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
