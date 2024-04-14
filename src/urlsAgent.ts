// src/urlsAgent.ts
import { ReconAgent, GatheredInformation } from './reconAgent.js';

/**
 * A list of URLs to gather information from.
 */
type UrlsAgentOptions = string[];

export class UrlsAgent extends ReconAgent<UrlsAgentOptions> {
  readonly name = 'urls';
  readonly description = 'Gathers information from URLs';

  async gather(urls: UrlsAgentOptions): Promise<GatheredInformation[]> {
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

  parseOptions(options: string): UrlsAgentOptions {
    return options.split(',');
  }
}
