import { APIGatewayProxyResult, S3Event } from 'aws-lambda';
import { lambdaHandler } from '../../app';

describe('Unit test for app handler', function () {
    it('verifies successful response', async () => {
        const event: S3Event = {
            "Records": [
                {
                  "eventVersion": "2.0",
                  "eventSource": "aws:s3",
                  "awsRegion": "us-east-1",
                  "eventTime": "1970-01-01T00:00:00.000Z",
                  "eventName": "ObjectCreated:Put",
                  "userIdentity": {
                    "principalId": "EXAMPLE"
                  },
                  "requestParameters": {
                    "sourceIPAddress": "127.0.0.1"
                  },
                  "responseElements": {
                    "x-amz-request-id": "EXAMPLE123456789",
                    "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
                  },
                  "s3": {
                    "s3SchemaVersion": "1.0",
                    "configurationId": "testConfigRule",
                    "bucket": {
                      "name": "docs-to-analyze",
                      "ownerIdentity": {
                        "principalId": "EXAMPLE"
                      },
                      "arn": "arn:aws:s3:::example-docs-to-analyze"
                    },
                    "object": {
                      "key": "OoPdfFormExample.pdf",
                      "size": 1024,
                      "eTag": "0123456789abcdef0123456789abcdef",
                      "sequencer": "0A1B2C3D4E5F678901"
                    }
                  }
                }
              ]
        };
        const result: APIGatewayProxyResult = await lambdaHandler(event, null);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'hello world',
            }),
        );
    });
});
