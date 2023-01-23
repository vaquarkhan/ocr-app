import { Logger } from '@aws-lambda-powertools/logger';
import OpenSearchCustomClient from '/opt/nodejs/common/utils/opensearch';

const logger = new Logger({ serviceName: 'SearchService' });

// Opensearch
const osClient = new OpenSearchCustomClient();
const osIndexName = String(process.env.OPENSEARCH_INDEX_NAME);

export async function search(keyword: string, token: string) {
    let response: any = {
        count: 0,
    };
    const results: any[] = [];
    const search = await osClient.search(osIndexName, keyword, token);
    if (search.statusCode == 200) {
        if (search.body.hits?.hits) {
            const hits = search.body.hits.hits as any[];
            for (let index = 0; index < hits.length; index++) {
                const element = hits[index];
                const contents = element.highlight?.content as any[];
                const result = {
                    documentId: element._id,
                    documentName: element._source.documentName,
                    bucketName: element._source.bucketName,
                    count: contents ? contents.length : 0,
                    lines: contents && contents.length >= 1 ? contents : null,
                };
                results.push(result);
            }
            response = {
                results,
                count: search.body.hits.total ? search.body.hits.total.value : 0,
            };
        }
    }
    return response;
}
