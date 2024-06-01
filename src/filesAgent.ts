// src/filesAgent.ts
import { ReconAgent, GatheredInformation } from "./reconAgent.js";
import { readFile, stat } from "fs/promises";
import { glob } from "glob";
import path from "path";
import { defaultExclusions } from "./defaultExclusions.js";

type FilesAgentOptions = string[];

export class FilesAgent implements ReconAgent<FilesAgentOptions> {
  readonly name = "files";
  readonly description = "Gathers information from files";

  async gather(
    filesOptions: FilesAgentOptions,
  ): Promise<GatheredInformation[]> {
    // Step 1: Collect all matching file paths with applied exclusions
    const { inclusionPatterns, exclusionPatterns } =
      this.parsePatterns(filesOptions);
    const filePaths = await this.collectFilePathsWithExclusions(
      inclusionPatterns,
      exclusionPatterns,
    );

    // Step 2: Convert file paths to GatheredInformation
    const gatheredInformation =
      await this.convertToGatheredInformation(filePaths);

    return gatheredInformation;
  }

  private async collectFilePathsWithExclusions(
    inclusionPatterns: string[],
    exclusionPatterns: string[],
  ): Promise<string[]> {
    const filePathPromises = inclusionPatterns.map(async (pattern) => {
      try {
        const fileStats = await stat(pattern);

        if (fileStats.isDirectory()) {
          // If it's a directory, collect all files within it
          const directoryFiles = await glob(path.join(pattern, "**", "*"), {
            nodir: true,
            ignore: [...defaultExclusions, ...exclusionPatterns],
          });
          return directoryFiles;
        } else {
          // If it's a file path, return it as is
          return [pattern];
        }
      } catch (error) {
        // If the path is not a file or directory, assume it's a glob pattern
        const matchedPaths = await glob(pattern, {
          nodir: true,
          ignore: [...defaultExclusions, ...exclusionPatterns],
        });
        return matchedPaths;
      }
    });

    const filePaths = await Promise.all(filePathPromises);
    return filePaths.flat();
  }

  private async convertToGatheredInformation(
    filePaths: string[],
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

  private parsePatterns(options: FilesAgentOptions) {
    const inclusionPatterns: string[] = [];
    const exclusionPatterns: string[] = [];

    options.forEach((option) => {
      if (option.startsWith("!")) {
        exclusionPatterns.push(option.slice(1));
      } else {
        inclusionPatterns.push(option);
      }
    });

    return { inclusionPatterns, exclusionPatterns };
  }
}
