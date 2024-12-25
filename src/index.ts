#!/usr/bin/env node
import { Command } from "commander";
import { gatherInformation } from "./gatherInformation.js";
import { loadConfig, ReconCommand } from "./config.js";
import { writeToFile } from "./fileWriter.js";
import { FilesAgent } from "./filesAgent.js";
import { UrlsAgent } from "./urlsAgent.js";
import { ReconAgent } from "./reconAgent.js";
import { NotesAgent } from "./notesAgent.js";
import { FunctionAgent } from "./functionAgent.js";

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

    const { config, configDir } = await loadConfig();

    const { commands } = config;

    // Try to get the command config from the config file
    let commandConfig = commands?.[command];

    // If the command is not found, try to use the default command
    if (!commandConfig) {
      commandConfig = { prompt: options.prompt, gather: {} };
    }

    if (options.prompt) {
      commandConfig.prompt = options.prompt;
    }

    // Create a new command config that includes both config file and CLI options
    const mergedConfig: ReconCommand = {
      ...commandConfig,
      gather: { ...commandConfig.gather },
    };

    // Create a map to track the source of each agent's options
    const optionsSourceMap: Record<string, "configFile" | "cli"> = {
      files: "configFile",
      urls: "configFile",
    };

    const filesAgent = new FilesAgent();
    if (options.files) {
      // CLI options are not from config
      mergedConfig.gather.files = filesAgent.parseOptions(options.files);
      optionsSourceMap["files"] = "cli"; // CLI options
    }

    const urlsAgent = new UrlsAgent();
    if (options.urls) {
      // CLI options are not from config
      mergedConfig.gather.urls = urlsAgent.parseOptions(options.urls);
      optionsSourceMap["urls"] = "cli"; // CLI options
    }

    // Mark config file options with 'configFile'
    for (const agentName in mergedConfig.gather) {
      if (!optionsSourceMap[agentName]) {
        optionsSourceMap[agentName] = "configFile"; // Config file options
      }
    }

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
      configDir,
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
