import { Command } from "commander";
import { gatherInformation } from "./gatherInformation.js";
import { loadConfig } from "./config.js";
import { writeToFile } from "./fileWriter.js";
import { FilesAgent } from "./filesAgent.js";
import { UrlsAgent } from "./urlsAgent.js";
import { ReconAgent } from "./reconAgent.js";

const program = new Command();

program
  .description("Gather information for a specific command")
  .option("-p, --prompt <prompt>", "Prompt to append to the output")
  .option("--clipboard", "Copy the prompt to the clipboard")
  .option(
    "-o, --output <file>",
    "Write the prompt to a file",
    (value, prev) => {
      if (value.startsWith("-")) {
        throw new Error("Invalid output file");
      }
      return value;
    }
  )
  .option("--stdout", "Send output to stdout even if piping wasn't detected")
  .option("--files <files>", "Comma-separated list of files or directories")
  .option("--urls <urls>", "Comma-separated list of URLs")
  .arguments("[command]")
  .action(async (command, options) => {

    const config = await loadConfig();

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

    const filesAgent = new FilesAgent();
    if (options.files) {
      commandConfig.gather.files = filesAgent.parseOptions(options.files);
    }

    const urlsAgent = new UrlsAgent();
    if (options.urls) {
      commandConfig.gather.urls = urlsAgent.parseOptions(options.urls);
    }

    let agents: ReconAgent<any>[] = [
      filesAgent,
      urlsAgent,
      ...(config.agents || []),
    ];

    const prompt = await gatherInformation(agents, commandConfig);

    const isPiped = !process.stdout.isTTY;

    if (options.clipboard) {
      const { default: clipboardy } = await import("clipboardy");
      clipboardy.writeSync(prompt);
      console.log("Prompt copied to clipboard");
    } else if (options.output) {
      await writeToFile(options.output, prompt);
      console.log(`Prompt written to ${options.output}`);
    } else if (isPiped || options.stdout) {
      process.stdout.write(prompt);
    } else {
      console.error("No output method specified");
      process.exit(1);
    }
  });

program.parse(process.argv);