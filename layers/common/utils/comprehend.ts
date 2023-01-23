import { Logger } from '@aws-lambda-powertools/logger';
import { ComprehendClient, DetectEntitiesCommand } from "@aws-sdk/client-comprehend";

export default class ComprehendCustomClient {
    private _logger = new Logger({ serviceName: "ComprehendCustomClient" });
    private _client: ComprehendClient;

    constructor() {
        this._client = new ComprehendClient({ region: process.env.REGION });
    }

    async detectEntitites(text: string) {
        try {
            const command = new DetectEntitiesCommand({
                LanguageCode: 'en',
                Text: text
            });
            const results = await this._client.send(command);
            this._logger.info(`Response status code of comprehend detect entities ${results.$metadata.httpStatusCode}`)
            if (results.Entities) {
                return results.Entities;
            }
            
        } catch (error) {
            this._logger.error(`Error encountered with comprehend`, error);
            throw error;
        }
        return [];
    }
}
