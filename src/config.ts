// src/config.ts
import { ReconAgent } from './reconAgent';
import path from 'path';
import os from 'os';

export interface ReconConfig {
  agents?: ReconAgent<any>[];
  commands?: Record<string, ReconCommand>;
}

export interface ReconCommand {
  prompt?: string;
  gather: {
    [key: string]: any;
  };
}

export async function loadConfig(): Promise<ReconConfig> {
  const homedir = os.homedir();
  
  const homeConfigPath = path.join(homedir, '.recon.config.mjs');
  const projectConfigPath = path.join(process.cwd(), '.recon.config.mjs');

  let homeConfig: ReconConfig = {};
  let projectConfig: ReconConfig = {};

  try {
    homeConfig = (await import(homeConfigPath)).default;
  } catch (_error) {
  }

  try {
    projectConfig = (await import(projectConfigPath)).default;
  } catch (_error) {
  }

  const mergedConfig: ReconConfig = {
    ...homeConfig,
    ...projectConfig,
    commands: {
      ...homeConfig.commands,
      ...projectConfig.commands,
    },
  };

  for (const [commandName, command] of Object.entries(projectConfig.commands || {})) {
    if (homeConfig.commands && homeConfig.commands[commandName]) {
      console.warn(
        `Warning: Command "${commandName}" is defined in both config files. ` +
          `The command from the project-level config will be used.`
      );
    }
  }

  return mergedConfig;
}