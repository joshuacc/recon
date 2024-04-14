// src/clipboard.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function isWsl(): Promise<boolean> {
  try {
    await execAsync('uname -a');
    return true;
  } catch (error) {
    return false;
  }
}

async function copyToClipboardMac(text: string): Promise<void> {
  await execAsync(`echo "${text}" | pbcopy`);
}

async function copyToClipboardWindows(text: string): Promise<void> {
  await execAsync(`echo | set /p="${text}" | clip`);
}

async function copyToClipboardLinux(text: string): Promise<void> {
  const wsl = await isWsl();
  if (wsl) {
    await execAsync(`echo "${text}" | clip.exe`);
  } else {
    await execAsync(`echo "${text}" | xclip -selection clipboard`);
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  switch (process.platform) {
    case 'darwin':
      await copyToClipboardMac(text);
      break;
    case 'win32':
      await copyToClipboardWindows(text);
      break;
    case 'linux':
      await copyToClipboardLinux(text);
      break;
    default:
      throw new Error('Unsupported platform');
  }
}