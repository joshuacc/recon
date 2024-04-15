// src/filesAgent.ts
import { ReconAgent, GatheredInformation } from "./reconAgent";
import { readFile, stat } from "fs/promises";
import { glob } from "glob";
import path from "path";

type FilesAgentOptions = string[];

export class FilesAgent extends ReconAgent<FilesAgentOptions> {
  readonly name = "files";
  readonly description = "Gathers information from files";

  async gather(
    filesOptions: FilesAgentOptions
  ): Promise<GatheredInformation[]> {
    // Step 1: Collect all matching file paths
    const filePaths = await this.collectFilePaths(filesOptions);

    // Step 2: Convert file paths to GatheredInformation
    const gatheredInformation =
      await this.convertToGatheredInformation(filePaths);

    return gatheredInformation;
  }

  private async collectFilePaths(
    filesOptions: FilesAgentOptions
  ): Promise<string[]> {
    const filePathPromises = filesOptions.map(async (fileOrDirPath) => {
      try {
        const fileStats = await stat(fileOrDirPath);

        if (fileStats.isDirectory()) {
          // If it's a directory, collect all files within it
          const directoryFiles = await glob(
            path.join(fileOrDirPath, "**", "*"),
            { nodir: true }
          );
          return directoryFiles;
        } else {
          // If it's a file path, return it as is
          return [fileOrDirPath];
        }
      } catch (error) {
        // If the path is not a file or directory, assume it's a glob pattern
        const matchedPaths = await glob(fileOrDirPath, { nodir: true });
        return matchedPaths;
      }
    });

    const filePaths = await Promise.all(filePathPromises);
    return filePaths.flat();
  }

  private async convertToGatheredInformation(
    filePaths: string[]
  ): Promise<GatheredInformation[]> {
    const gatheredInformationPromises = filePaths.map(async (filePath) => {
      const content = await readFile(filePath, "utf-8");

      const gatheredFileInfo: GatheredInformation = {
        tag: "file",
        attrs: {
          name: filePath,
        },
        content,
      };

      return gatheredFileInfo;
    });

    return Promise.all(gatheredInformationPromises);
  }

  parseOptions(options: string): FilesAgentOptions {
    return options.split(",");
  }
}
