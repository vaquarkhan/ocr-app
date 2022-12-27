import { APIGatewayProxyResult, Context, SQSEvent, SQSRecord } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import TextractCustomClient from './utils/textract';
import S3CustomClient from './utils/s3';
import DataStore from './utils/datastore';
import { ITextractResultsMessageModel } from './models/textract-results.model';
import { GetDocumentAnalysisCommandOutput } from '@aws-sdk/client-textract';
import { ApiAnalyzeDocumentResponse, TextractDocument } from 'amazon-textract-response-parser';
import { readFileSync } from 'fs';
import { appendFile } from 'fs/promises';
import OpenSearchCustomClient from './utils/opensearch';

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

// Opensearch
const osClient = new OpenSearchCustomClient();
const osIndexName = String(process.env.OPENSEARCH_DOMAIN);

export async function indexDocument(
    documentId: string,
    bucketName: string,
    documentName: string,
    textractDocument: TextractDocument,
) {
    logger.info(`Indexing document: ${documentId}`);
    let text = '';
    for (const page of textractDocument.listPages()) {
        for (const line of page.listLines()) {
            text += line.text + ' ';
        }
    }
    const document = {
        documentId,
        bucketName,
        documentName,
        content: text,
    };
    return osClient.index(osIndexName, documentId, document);
}

export async function storeForms(documentId: string, bucket: string, textractDocument: TextractDocument) {
    for await (const page of textractDocument.listPages()) {
        // No forms found
        if (page.form.nFields === 0) {
            return;
        }
        const fileName = `form-${page.pageNumber}.csv`;
        const localPath = `/tmp/${documentId}-${fileName}`;

        // Write keys
        let fieldNum = 1;
        let csv = '';
        for (const field of page.form.listFields()) {
            csv += `${field.key.text}`;
            if (fieldNum < page.form.nFields) {
                csv += ',';
            }
            fieldNum++;
        }
        csv += '\n';
        await appendFile(localPath, csv);
        // Write content
        fieldNum = 1;
        csv = '';
        for (const field of page.form.listFields()) {
            csv += `${field.value?.text}`;
            if (fieldNum < page.form.nFields) {
                csv += ',';
            }
            fieldNum++;
        }
        csv += '\n';
        await appendFile(localPath, csv);

        const file = await readFileSync(localPath);
        // Store form in S3
        const s3Path = `${documentId}/${fileName}`;
        await s3Client.putObject(bucket, s3Path, file);

        // Store output details in table
        await outputsDataStore.createOutput(documentId, `FORM-${page.pageNumber}`, s3Path);
    }
}

export async function storeTables(documentId: string, bucket: string, textractDocument: TextractDocument) {
    for await (const page of textractDocument.listPages()) {
        let tableIndex = 1;
        for await (const table of page.listTables()) {
            const fileName = `table-${page.pageNumber}-${tableIndex}.csv`;
            const localPath = `/tmp/${documentId}-${fileName}`;
            for (const row of table.listRows()) {
                let csv = ``;
                for (const cell of row.listCells()) {
                    csv += `${cell.text}`;
                    if (cell.columnIndex < row.nCells) {
                        csv += ',';
                    }
                }
                csv += '\n';
                await appendFile(localPath, csv);
            }
            const file = await readFileSync(localPath);
            // Store form in S3
            const s3Path = `${documentId}/${fileName}`;
            await s3Client.putObject(bucket, s3Path, file);

            // Store output details in table
            await outputsDataStore.createOutput(documentId, `TABLE-${page.pageNumber}-${tableIndex}`, s3Path);
            tableIndex++;
        }
    }
}

export async function processRecord(record: SQSRecord) {
    const textractNotification = JSON.parse(record.body);
    const textractNotificationMessage: ITextractResultsMessageModel = JSON.parse(textractNotification.Message);
    logger.info(`Textract notification message: ${JSON.stringify(textractNotification)}`);

    // Check if process was successful
    if (textractNotificationMessage.Status === 'SUCCEEDED') {
        const documentId = textractNotificationMessage.JobTag;
        const path = `${documentId}/textract-response.json`;
        const bucket = textractNotificationMessage.DocumentLocation.S3Bucket;

        // Fetch textract output from Textract
        let fullResponse!: GetDocumentAnalysisCommandOutput;
        let hasNext = true;
        let nextToken;
        while (hasNext) {
            const analysis: GetDocumentAnalysisCommandOutput = await textractClient.getAnalyzeDocument(
                textractNotificationMessage.JobId,
                nextToken,
            );
            logger.info(`Get analysis status: ${analysis.$metadata.httpStatusCode}, Next Token: ${analysis.NextToken}`);
            if (!fullResponse) {
                fullResponse = analysis;
            } else if (analysis.Blocks) {
                fullResponse.Blocks = fullResponse.Blocks?.concat(analysis.Blocks);
            }
            nextToken = analysis.NextToken;
            fullResponse.NextToken = nextToken;
            hasNext = nextToken !== undefined;
        }
        const textractData = JSON.stringify(fullResponse);
        const textractResponse = JSON.parse(textractData) as ApiAnalyzeDocumentResponse;
        const textractDocument = new TextractDocument(textractResponse);

        // Store analysis in S3
        await s3Client.putObject(bucket, path, textractData);

        // Store output details in table
        await outputsDataStore.createOutput(documentId, 'TEXTRACT-RESPONSE', path);

        // Store forms
        await storeForms(documentId, bucket, textractDocument);

        // Store tables
        await storeTables(documentId, bucket, textractDocument);

        // Index document
        await indexDocument(
            documentId,
            bucket,
            textractNotificationMessage.DocumentLocation.S3ObjectName,
            textractDocument,
        );

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
