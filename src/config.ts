import { ReconAgent } from "./reconAgent";
import path from "path";
import os from "os";
import fs from "fs";

export interface ReconConfig {
  agents?: ReconAgent<unknown>[];
  commands?: Record<string, ReconCommand>;
}

export interface ReconCommand {
  prompt?: string;
  gather: {
    [key: string]: unknown;
  };
}

export async function loadConfig(): Promise<{
  config: ReconConfig;
  commandConfigDirs: Record<string, string | undefined>;
  defaultConfigDir?: string;
}> {
  const homedir = os.homedir();
  const homeConfigPath = path.join(homedir, ".recon.config.mjs");
  let homeConfig: ReconConfig = {};
  let projectConfig: ReconConfig = {};
  const commandConfigDirs: Record<string, string | undefined> = {};
  let homeConfigDir: string | undefined;

  if (fs.existsSync(homeConfigPath)) {
    homeConfig = (await import(homeConfigPath)).default;
    homeConfigDir = path.dirname(homeConfigPath);
  }

  const projectConfigPath = findProjectConfig(process.cwd());
  let projectConfigDir: string | undefined;
  if (projectConfigPath) {
    projectConfig = (await import(projectConfigPath)).default;
    projectConfigDir = path.dirname(projectConfigPath);
  }

  const mergedConfig: ReconConfig = {
    ...homeConfig,
    ...projectConfig,
    commands: {
      ...homeConfig.commands,
      ...projectConfig.commands,
    },
  };

  for (const commandName of Object.keys(projectConfig.commands || {})) {
    if (homeConfig.commands && homeConfig.commands[commandName]) {
      console.warn(
        `Warning: Command "${commandName}" is defined in both config files. ` +
          `The command from the project-level config will be used.`,
      );
    }
  }

  for (const commandName of Object.keys(homeConfig.commands || {})) {
    commandConfigDirs[commandName] = homeConfigDir;
  }

  for (const commandName of Object.keys(projectConfig.commands || {})) {
    commandConfigDirs[commandName] = projectConfigDir;
  }

  return {
    config: mergedConfig,
    commandConfigDirs,
    defaultConfigDir: projectConfigDir || homeConfigDir,
  };
}

function findProjectConfig(startDir: string): string | null {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    const configPath = path.join(currentDir, ".recon.config.mjs");
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}
