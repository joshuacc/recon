// src/config.ts
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

export async function loadConfig(): Promise<ReconConfig> {
  const homedir = os.homedir();

  const homeConfigPath = path.join(homedir, ".recon.config.mjs");
  const projectConfigPath = path.join(process.cwd(), ".recon.config.mjs");

  let homeConfig: ReconConfig = {};
  let projectConfig: ReconConfig = {};

  
  if (fs.existsSync(homeConfigPath)) {
    homeConfig = (await import(homeConfigPath)).default;
  }

  if (fs.existsSync(projectConfigPath)) {
    projectConfig = (await import(projectConfigPath)).default;
  }

  const mergedConfig: ReconConfig = {
    ...homeConfig,
    ...projectConfig,
    commands: {
      ...homeConfig.commands,
      ...projectConfig.commands,
    },
  };

  for (const commandName of Object.keys(
    projectConfig.commands || {},
  )) {
    if (homeConfig.commands && homeConfig.commands[commandName]) {
      console.warn(
        `Warning: Command "${commandName}" is defined in both config files. ` +
          `The command from the project-level config will be used.`,
      );
    }
  }

  return mergedConfig;
}
