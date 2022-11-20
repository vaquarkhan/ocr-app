import { APIGatewayProxyResult, Context, S3Event, S3EventRecord, SQSEvent, SQSRecord } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import TextractCustomClient from './utils/textract';
import S3CustomClient from './utils/s3';
import DataStore from './utils/datastore';

const logger = new Logger();

// DynamoDB
const docsTableName = String(process.env.DOCS_TABLE);
const outputTableName = String(process.env.OUTPUTS_TABLE);
const documentsDataStore = new DataStore(docsTableName);
const outputsDataStore = new DataStore(outputTableName);

// Textract
const textractClient = new TextractCustomClient();

// S3
const s3Client = new S3CustomClient();

export async function processRecord(record: SQSRecord) {
    const textractNotification: ITextractResultsModel = JSON.parse(record.body);
    logger.info(`Textract notification message: ${JSON.stringify(textractNotification)}`);

    // Check if process was successful
    if (textractNotification.Message.Status === 'SUCCEEDED') {

        const documentId = textractNotification.Message.JobTag;
        const path = `${textractNotification.Message.DocumentLocation.S3ObjectName}.json`;
        const bucket = textractNotification.Message.DocumentLocation.S3Bucket;

        // Fetch textract output from Textract
        const analysis = await textractClient.getAalyzeDocument(textractNotification.Message.JobId);

        // Store analysis in S3
        await s3Client.putObject(bucket, path, analysis);

        // Store output details in table
        await outputsDataStore.createOutput(documentId, 'RESPONSE', path);

        // Mark document as completed in table
        await documentsDataStore.markDocumentCompleted(documentId);
    }

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
                message: 'processed successfully',
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