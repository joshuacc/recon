import { ReconCommand } from "./config.js";
import { FilesAgent, SourcedFileOption } from "./filesAgent.js";
import { UrlsAgent } from "./urlsAgent.js";

type OptionsSource = "configFile" | "cli";

interface CliOptions {
  prompt?: string;
  files?: string;
  urls?: string;
}

export function mergeCommandConfigWithCli(
  commandConfig: ReconCommand,
  cliOptions: CliOptions,
  filesAgent: FilesAgent,
  urlsAgent: UrlsAgent,
  commandConfigDir?: string,
): {
  mergedConfig: ReconCommand;
  optionsSourceMap: Record<string, OptionsSource>;
} {
  const mergedConfig: ReconCommand = {
    ...commandConfig,
    gather: { ...commandConfig.gather },
  };

  if (cliOptions.prompt) {
    mergedConfig.prompt = cliOptions.prompt;
  }

  const optionsSourceMap: Record<string, OptionsSource> = {};
  for (const agentName in mergedConfig.gather) {
    optionsSourceMap[agentName] = "configFile";
  }

  const configFiles = normalizeStringArray(mergedConfig.gather.files);
  const cliFiles = cliOptions.files
    ? filesAgent.parseOptions(cliOptions.files)
    : [];

  if (configFiles.length > 0 || cliFiles.length > 0) {
    const sourcedFileOptions: SourcedFileOption[] = [
      ...configFiles.map((filePath) => ({
        path: filePath,
        configSource: "configFile" as const,
        configDir: commandConfigDir,
      })),
      ...cliFiles.map((filePath) => ({
        path: filePath,
        configSource: "cli" as const,
      })),
    ];

    mergedConfig.gather.files = sourcedFileOptions;
    optionsSourceMap.files = configFiles.length > 0 ? "configFile" : "cli";
  }

  const configUrls = normalizeStringArray(mergedConfig.gather.urls);
  const cliUrls = cliOptions.urls
    ? urlsAgent.parseOptions(cliOptions.urls)
    : [];

  if (configUrls.length > 0 || cliUrls.length > 0) {
    mergedConfig.gather.urls = [...configUrls, ...cliUrls];
    optionsSourceMap.urls = configUrls.length > 0 ? "configFile" : "cli";
  }

  return {
    mergedConfig,
    optionsSourceMap,
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
