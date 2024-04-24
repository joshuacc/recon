// src/index.ts
import { Command } from 'commander';
import { ReconAgent } from './reconAgent.js';
import { loadConfig } from './config.js';
import { gatherInformation } from './gatherInformation.js';
import { writeToFile } from './fileWriter.js';

const program = new Command();

program
  .name('recon')
  .description('A CLI tool for gathering information')
  .version('0.1.0');

async function run() {
  const config = await loadConfig();

  config.agents?.forEach((agent: ReconAgent<any>) => {
    if (agent.parseOptions) {
      program.option(`--agent:${agent.name} <options>`, agent.description);
    }
  });

  program
    .command('run')
    .description('Run a recon command')
    .argument('<command>', 'The command to run')
    .option('-o, --output <file>', 'Output to a file')
    .action(async (commandName, options) => {
      const commandConfig = config.commands?.[commandName];

      if (!commandConfig) {
        console.error(`Error: Command "${commandName}" not found`);
        process.exit(1);
      }

      const agents = config.agents || [];

      const agentMap: Record<string, ReconAgent<any>> = {};
      agents.forEach((agent) => {
        agentMap[agent.name] = agent;
      });

      const gather: Record<string, any> = {};
      for (const [key, value] of Object.entries(commandConfig.gather)) {
        const agent = agentMap[key];
        if (agent && agent.parseOptions) {
          gather[key] = agent.parseOptions(program.getOptionValue(`agent:${key}`) || value);
        } else {
          gather[key] = value;
        }
      }

      const prompt = await gatherInformation(agents, { ...commandConfig, gather });

      let outputMethods = 0;

      if (options.clipboard) {
        const { default: clipboardy } = await import("clipboardy");
        clipboardy.writeSync(prompt);
        console.log("Prompt copied to clipboard");
        outputMethods++;
      }
      
      if (options.output) {
        await writeToFile(options.output, prompt);
        console.log(`Prompt written to ${options.output}`);
        outputMethods++;
      }
      
      const isPiped = !process.stdout.isTTY;
  
      if (options.stdout || isPiped) {
        process.stdout.write(prompt);
        outputMethods++;
      }
  
      if (outputMethods === 0) {
        console.warn("No output method detected or specified");
      }
  
    });

  await program.parseAsync(process.argv);
}

run().catch((err) => {
  console.error('An error occurred:', err);
  process.exit(1);
});
