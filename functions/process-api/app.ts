import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createDocument, getDocumentById, getDocuments, getOutputs } from './services/documents.service';
import { search } from './services/search.service';

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
            case '/api/documents/{id}': {
                const { id } = event.pathParameters ?? {};
                if (id) {
                    body = await getDocumentById(id);
                    statusCode = 200;
                }
                break;
            }

            case '/api/documents/{id}/outputs': {
                const { id } = event.pathParameters ?? {};
                if (id) {
                    body = await getOutputs(id);
                    statusCode = 200;
                }
                break;
            }

            case '/api/documents': {
                switch (event.httpMethod) {
                    case 'GET':
                        body = await getDocuments();
                        statusCode = 200;
                        break;
                    case 'POST':
                        if (event.body) {
                            const { keys } = JSON.parse(event.body);
                            body = await createDocument(keys);
                            statusCode = 200;
                        }
                    default:
                        break;
                }
                break;
            }

            case '/api/search': {
                if (event.queryStringParameters?.keyword) {
                    body = await search(event.queryStringParameters.keyword);
                    statusCode = 200;
                }
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
