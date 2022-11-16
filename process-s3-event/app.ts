import { APIGatewayProxyResult, Context, S3Event, S3EventRecord } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { v4 } from 'uuid';
import DataStore from './utils/datastore';
import TextractCustomClient from './utils/textract';
import S3CustomClient from './utils/s3';

const logger = new Logger();

// DynamoDB
const docsTableName = String(process.env.DOCS_TABLE);
const documentsDataStore = new DataStore(docsTableName);

// Textract
const textractClient = new TextractCustomClient();

// S3
const s3Client = new S3CustomClient();

export async function processRecord(record: S3EventRecord) {
    // Fetch bucket and object name from the new S3 event record
    const bucketName = record.s3.bucket.name;
    const objectName = record.s3.object.key;

    // Create document with IN_PROGRESS status
    const documentId = v4(); // Generate random uuid
    await documentsDataStore.createDocument(documentId, bucketName, objectName);

    // Analyze document using Textract
    const analysis = await textractClient.analyzeDocument(bucketName, objectName);

    // Store analysis in S3
    await s3Client.putObject(bucketName, `${documentId}.json`, analysis);

    // Mark document as completed in table
    await documentsDataStore.markDocumentCompleted(documentId);
}

/**
 *
 * @param {APIGatewayProxyEvent} event - API Gateway Lambda Proxy Input Format
 * @param {Context} object - Lambda $context variable
 *
 * @returns {APIGatewayProxyResult} object - API Gateway Lambda Proxy Output Format
 *
 */
export const lambdaHandler = async (event: S3Event, context: Context): Promise<APIGatewayProxyResult> => {
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