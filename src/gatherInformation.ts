// src/gatherInformation.ts
import { ReconCommand } from "./config";
import { ReconAgent, GatheredInformation } from "./reconAgent";

export async function gatherInformation(
  agents: ReconAgent<any>[],
  commandConfig: ReconCommand
): Promise<string> {
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

${flattenedInformation.map(formatGatheredInformation).join("\n\n")}

${commandConfig.prompt ? `<directions>\n${commandConfig.prompt}\n</directions>` : ""}
`;

  return prompt.trim();
}

function formatGatheredInformation(info: GatheredInformation): string {
    let formattedInfo = `<${info.tag}`;
    for (const [key, value] of Object.entries(info.attrs)) {
      formattedInfo += ` ${key}="${value}"`;
    }
    formattedInfo += `>\n${info.content}\n</${info.tag}>`;
    return formattedInfo;
}