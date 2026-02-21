#!/usr/bin/env node
import { Command } from "commander";
import { gatherInformation } from "./gatherInformation.js";
import { loadConfig } from "./config.js";
import { writeToFile } from "./fileWriter.js";
import { FilesAgent } from "./filesAgent.js";
import { UrlsAgent } from "./urlsAgent.js";
import { ReconAgent } from "./reconAgent.js";
import { NotesAgent } from "./notesAgent.js";
import { FunctionAgent } from "./functionAgent.js";
import { mergeCommandConfigWithCli } from "./mergeCommandConfig.js";

const program = new Command();

program
  .description("Gather information for a specific command")
  .option("-p, --prompt <prompt>", "Prompt to append to the output")
  .option("--clipboard", "Copy the prompt to the clipboard")
  .option("-o, --output <file>", "Write the prompt to a file")
  .option("--stdout", "Send output to stdout")
  .option("--files <files>", "Comma-separated list of files or directories")
  .option("--urls <urls>", "Comma-separated list of URLs")
  .arguments("[command]")
  .action(async (command, options) => {
    if (!command && Object.keys(options).length === 0) {
      program.outputHelp();
      return;
    }

    const { config, commandConfigDirs, defaultConfigDir } = await loadConfig();

    const { commands } = config;

    // Try to get the command config from the config file
    let commandConfig = commands?.[command];

    // If the command is not found, try to use the default command
    if (!commandConfig) {
      commandConfig = { prompt: options.prompt, gather: {} };
    }

    const filesAgent = new FilesAgent();
    const urlsAgent = new UrlsAgent();
    const commandConfigDir =
      (command ? commandConfigDirs[command] : undefined) || defaultConfigDir;
    const { mergedConfig, optionsSourceMap } = mergeCommandConfigWithCli(
      commandConfig,
      options,
      filesAgent,
      urlsAgent,
      commandConfigDir,
    );

    const agents: ReconAgent<unknown>[] = [
      filesAgent,
      urlsAgent,
      ...(config.agents || []),
      new NotesAgent(),
      new FunctionAgent(),
    ];

    const prompt = await gatherInformation(
      agents,
      mergedConfig,
      optionsSourceMap,
      commandConfigDir,
    );

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

program.parse(process.argv);
