// src/gatherInformation.ts
import { ReconCommand } from "./config.js";
import { ReconAgent, GatheredInformation } from "./reconAgent.js";

export async function gatherInformation(
  agents: ReconAgent<unknown>[],
  commandConfig: ReconCommand,
  optionsSourceMap: Record<string, "configFile" | "cli">,
  configDir?: string,
): Promise<string> {
  const gatheredInformation: GatheredInformation[][] = await Promise.all(
    agents.map(async (agent) => {
      const agentName = agent.name;
      const agentOptions = commandConfig.gather[agentName];

      if (!agentOptions) {
        return [];
      }

      // Pass context to all agents
      // For command line options, fromConfig will be false
      // For config file options, fromConfig will be true
      const configSource = optionsSourceMap[agentName];

      return agent.gather(agentOptions, {
        configDir,
        configSource,
      });
    }),
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
