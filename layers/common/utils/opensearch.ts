import { Logger } from '@aws-lambda-powertools/logger';
import { Client } from '@opensearch-project/opensearch';
import createAwsOpensearchConnector from 'aws-opensearch-connector';
const AWS = require('aws-sdk');

export default class OpenSearchCustomClient {
    private _logger = new Logger({ serviceName: 'OpenSearchCustomClient' });
    private _host = String(process.env.OPENSEARCH_ENDPOINT);

    constructor() {}

    private async _getClient() {
        const connector = createAwsOpensearchConnector(AWS.config);
        return new Client({
            ...connector,
            node: `https://${this._host}`,
        });
    }

    async index(indexName: string, id: string, body: any) {
        let client = await this._getClient();
        const response = await client.index({
            index: indexName,
            id,
            body,
        });
        return { statusCode: response.statusCode };
    }

    async search(indexName: string, keyword: string) {
        let client = await this._getClient();
        const response = await client.search({
            index: indexName,
            body: {
                query: {
                    query_string: {
                        query: keyword,
                    },
                },
                highlight: {
                    fields: {
                        content: { pre_tags: [''], post_tags: [''] },
                    },
                    fragment_size: 100,
                    require_field_match: false,
                },
            },
            filter_path: ['hits.hits._id', 'hits.hits._source', 'hits.hits.highlight', 'hits.total'],
        });
        return response;
    }
}
