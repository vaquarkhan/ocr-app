import { Logger } from '@aws-lambda-powertools/logger';
import DynamoCustomClient from '../utils/dynamodb';

const logger = new Logger({ serviceName: 'DataStore' });

// DynamoDB
const docsTableName = String(process.env.DOCS_TABLE);
const outputTableName = String(process.env.OUTPUTS_TABLE);
const ddb = new DynamoCustomClient();

export async function getDocuments() {
    const data = await ddb.readAll(docsTableName);
    return data;
}

export async function getDocumentById(id: string) {
    const data = await ddb.read(docsTableName, { documentId: id });
    return data;
}

export async function getOutputs(id: string) {
    const keyCndExp = 'documentId = :documentId';
    const expVal = { ':documentId': id };
    const data = await ddb.query(outputTableName, keyCndExp, expVal);
    return data;
}
