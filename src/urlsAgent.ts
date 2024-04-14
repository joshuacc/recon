// src/urlsAgent.ts
import { ReconAgent, GatheredInformation } from './reconAgent';

interface UrlsAgentOptions {
  urls: string[];
}

export class UrlsAgent extends ReconAgent<UrlsAgentOptions> {
  readonly name = 'urls';
  readonly description = 'Gathers information from URLs';

  async gather(options: UrlsAgentOptions): Promise<GatheredInformation[]> {
    const { urls } = options;

    const urlContent = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        return response.text();
      })
    );

    return [
      {
        tag: 'urls',
        attrs: {},
        content: urlContent.join('\n'),
      },
    ];
  }
}
