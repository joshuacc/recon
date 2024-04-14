// src/index.ts
import { Command } from 'commander';
import { gatherInformation } from './gatherInformation';
import { loadConfig } from './config';
import { copyToClipboard } from './clipboard';
import { writeToFile } from './fileWriter';
import { FilesAgent } from './filesAgent';
import { UrlsAgent } from './urlsAgent';
import { ReconAgent } from './reconAgent';

const program = new Command();

program
  .argument('[command]', 'A custom command to use from your .recon.config.js file')
  .argument('[directions]', 'Directions for the task')
  .description('Gather information for a specific command')
  .option('--clipboard', 'Copy the prompt to the clipboard')
  .option('--output <file>', 'Write the prompt to a file')
  .action(async (commandName, directions, options) => {
    console.log("commandName", commandName)
    console.log("directions", directions)
    console.log("options", options)
    const config = loadConfig();
    console.log("config", config)
    const { commands } = config;

    // Try to get the command config from the config file
    let commandConfig = commands?.[commandName]

    // If the command is not found, try to use the default command
    if (!commandConfig) {
      commandConfig = {
        directions,
        gather: {},
      };
    }

    let agents: ReconAgent<any>[] = [
        new FilesAgent(),
        new UrlsAgent(),
        ...(config.agents || []),
    ];

    const prompt = await gatherInformation(agents, commandConfig);

    if (options.clipboard) {
      await copyToClipboard(prompt);
      console.log('Prompt copied to clipboard');
    } else if (options.output) {
      await writeToFile(options.output, prompt);
      console.log(`Prompt written to ${options.output}`);
    } else {
    //   console.log(prompt);
    }
  });

program.parse(process.argv);