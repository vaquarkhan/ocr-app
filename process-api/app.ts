import { APIGatewayEvent, APIGatewayProxyResult, Context, SQSEvent, SQSRecord } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { getDocumentById, getDocuments, getOutputs } from './services/documents.service';

const logger = new Logger();

/**
 *
 * @param {APIGatewayProxyEvent} event - API Gateway Lambda Proxy Input Format
 * @param {Context} context - Lambda $context variable
 *
 * @returns {APIGatewayProxyResult} object - API Gateway Lambda Proxy Output Format
 *
 */
export const lambdaHandler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    logger.info(`Event: ${JSON.stringify(event, null, 2)}`);
    let response: APIGatewayProxyResult;
    let body: any;
    let statusCode = 400;
    try {
        switch (event.resource) {
            case '/documents/{id}': {
                const { id } = event.pathParameters ?? {};
                if (id) {
                    body = await getDocumentById(id);
                    statusCode = 200;
                }
                break;
            }

            case '/documents/{id}/outputs': {
                const { id } = event.pathParameters ?? {};
                if (id) {
                    body = await getOutputs(id);
                    statusCode = 200;
                }
                break;
            }

            case '/documents': {
                body = await getDocuments();
                statusCode = 200;
                break;
            }

            default:
                // No handler for request
                break;
        }
        response = {
            statusCode,
            body: JSON.stringify(body),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            },
        };
    } catch (error) {
        // Error handling
        response = {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            },
        };
        logger.error('some error happened', { error });
    }

    return response;
};
