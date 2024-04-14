// src/filesAgent.ts
import { ReconAgent, GatheredInformation } from './reconAgent';
import { readFile, stat } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

type FilesAgentOptions = string[];

export class FilesAgent extends ReconAgent<any> {
  readonly name = 'files';
  readonly description = 'Gathers information from files';

  async gather(filesOptions: FilesAgentOptions): Promise<GatheredInformation[]> {
    console.log("file options", filesOptions);

    const fileContent = await Promise.all(
      filesOptions.map(async (fileOrGlob) => {
        const filePaths = await glob(fileOrGlob);

        const filePromises = filePaths.map(async (filePath) => {
          const fileStats = await stat(filePath);

          if (fileStats.isDirectory()) {
            // Recursively gather files from the directory
            const directoryFiles = await this.gatherFilesFromDirectory(filePath);
            return directoryFiles.join('\n');
          } else {
            // Read the file content
            return readFile(filePath, 'utf-8');
          }
        });

        return (await Promise.all(filePromises)).join('\n');
      })
    );

    return [
      {
        tag: 'files',
        attrs: {},
        content: fileContent.join('\n'),
      },
    ];
  }

  private async gatherFilesFromDirectory(directoryPath: string): Promise<string[]> {
    const filePaths = await glob(path.join(directoryPath, '**', '*'));

    const filePromises = filePaths.map(async (filePath) => {
      const fileStats = await stat(filePath);

      if (fileStats.isDirectory()) {
        // Skip directories
        return '';
      } else {
        // Read the file content
        return readFile(filePath, 'utf-8');
      }
    });

    return Promise.all(filePromises);
  }
}