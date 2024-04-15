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
  
  const homeConfigPath = path.join(homedir, '.recon.config.js');
  const projectConfigPath = path.join(process.cwd(), '.recon.config.js');

  let homeConfig: ReconConfig = {};
  let projectConfig: ReconConfig = {};

  try {
    homeConfig = await import(homeConfigPath);
  } catch (error) {
    console.info(`No home-level config file found at ${homeConfigPath}`)
  }

  try {
    projectConfig = await import(projectConfigPath);
  } catch (error) {
    console.info(`No project-level config file found at ${projectConfigPath}`)
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