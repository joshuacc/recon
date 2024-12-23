// src/filesAgent.ts
import {
  ReconAgent,
  GatheredInformation,
  GatherContext,
} from "./reconAgent.js";
import { readFile, stat } from "fs/promises";
import { glob } from "glob";
import path from "path";
import { defaultExclusions } from "./defaultExclusions.js";

interface FilePathOption {
  path: string;
  fromConfig: boolean;
}

type FilesAgentOptions = (string | FilePathOption)[];

export class FilesAgent implements ReconAgent<FilesAgentOptions> {
  readonly name = "files";
  readonly description = "Gathers information from files";

  async gather(
    filesOptions: FilesAgentOptions,
    context?: GatherContext,
  ): Promise<GatheredInformation[]> {
    // Step 1: Collect all matching file paths with applied exclusions
    const { inclusionPatterns, exclusionPatterns } =
      this.parsePatterns(filesOptions);
    const filePaths = await this.collectFilePathsWithExclusions(
      inclusionPatterns,
      exclusionPatterns,
      context,
    );

    // Step 2: Convert file paths to GatheredInformation
    const gatheredInformation = await this.convertToGatheredInformation(
      filePaths,
      context?.configDir,
      inclusionPatterns,
    );

    return gatheredInformation;
  }

  private async collectFilePathsWithExclusions(
    inclusionPatterns: (string | FilePathOption)[],
    exclusionPatterns: string[],
    context?: GatherContext,
  ): Promise<string[]> {
    const filePathPromises = inclusionPatterns.map(async (pattern) => {
      // Only resolve relative to configDir if the pattern is from config
      const patternStr = typeof pattern === "string" ? pattern : pattern.path;
      const isFromConfig = context?.fromConfig ?? false;
      const resolvedPattern =
        context?.configDir && isFromConfig
          ? path.join(context.configDir, patternStr)
          : patternStr;

      try {
        const fileStats = await stat(resolvedPattern);

        if (fileStats.isDirectory()) {
          // If it's a directory, collect all files within it
          const directoryFiles = await glob(
            path.join(resolvedPattern, "**", "*"),
            {
              nodir: true,
              ignore: [...defaultExclusions, ...exclusionPatterns],
            },
          );
          return directoryFiles;
        } else {
          // If it's a file path, return it as is
          return [resolvedPattern];
        }
      } catch (error) {
        // If the path is not a file or directory, assume it's a glob pattern
        const matchedPaths = await glob(resolvedPattern, {
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
    baseDir?: string,
    originalPaths?: (string | FilePathOption)[],
  ): Promise<GatheredInformation[]> {
    const gatheredInformationPromises = filePaths.map(async (filePath) => {
      const content = await readFile(filePath, "utf-8");

      // If baseDir is provided, convert absolute paths back to relative paths for display
      let displayPath = filePath;
      if (baseDir && originalPaths?.length === 1) {
        // If there's only one original path, use it directly
        const originalPath = originalPaths[0];
        displayPath =
          typeof originalPath === "string" ? originalPath : originalPath.path;
      } else if (baseDir) {
        // Otherwise try to make the path relative to baseDir
        const relativePath = path.relative(baseDir, filePath);
        displayPath = relativePath.startsWith("..") ? filePath : relativePath;
      }

      const gatheredFileInfo: GatheredInformation = {
        tag: "file",
        attrs: {
          name: displayPath,
        },
        content,
      };

      return gatheredFileInfo;
    });

    return Promise.all(gatheredInformationPromises);
  }

  parseOptions(options: string): FilesAgentOptions {
    return options.split(",").map((path) => ({
      path,
      fromConfig: false,
    }));
  }

  private parsePatterns(options: FilesAgentOptions) {
    const inclusionPatterns: (string | FilePathOption)[] = [];
    const exclusionPatterns: string[] = [];

    options.forEach((option) => {
      const isString = typeof option === "string";
      const path = isString ? option : option.path;

      if (path.startsWith("!")) {
        exclusionPatterns.push(path.slice(1));
      } else {
        inclusionPatterns.push(option);
      }
    });

    return { inclusionPatterns, exclusionPatterns };
  }
}
