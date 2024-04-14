// src/gatherInformation.ts
import { ReconAgent, GatheredInformation } from "./reconAgent";

interface CommandConfig {
  directions?: string;
  gather: {
    [key: string]: any;
  };
}

export async function gatherInformation(
  agents: ReconAgent<any>[],
  commandConfig: any
): Promise<string> {
  console.log("command config", commandConfig);

  const gatheredInformation: GatheredInformation[][] = await Promise.all(
    agents.map(async (agent) => {
      const agentName = agent.name;
      const agentOptions = commandConfig.gather[agentName];

      if (!agentOptions) {
        return [];
      }

      return agent.gather(agentOptions);
    })
  );

  const flattenedInformation = gatheredInformation.flat();

  const prompt = `
<task>Using the context gathered from the following sources, follow the directions given below:</task>

${flattenedInformation
  .map(
    (info) =>
      `<${info.tag} ${Object.entries(info.attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ")}>${info.content}</${info.tag}>`
  )
  .join("\n  ")}

<directions>${commandConfig.directions}</directions>
`;

  return prompt.trim();
}
