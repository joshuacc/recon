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

export interface SourcedFileOption {
  path: string;
  configSource: "configFile" | "cli";
  configDir?: string;
}

type FilesAgentOptions = string[] | SourcedFileOption[];

interface FilePattern {
  pattern: string;
  configSource: "configFile" | "cli";
  configDir?: string;
}

interface MatchedFilePath {
  filePath: string;
}

export class FilesAgent implements ReconAgent<FilesAgentOptions> {
  readonly name = "files";
  readonly description = "Gathers information from files";

  async gather(
    filesOptions: FilesAgentOptions,
    context: GatherContext,
  ): Promise<GatheredInformation[]> {
    const normalizedOptions = this.normalizeOptions(filesOptions, context);

    // Step 1: Collect all matching file paths with applied exclusions
    const { inclusionPatterns, exclusionPatterns } =
      this.parsePatterns(normalizedOptions);
    const filePaths = await this.collectFilePathsWithExclusions(
      inclusionPatterns,
      exclusionPatterns,
    );

    // Step 2: Convert file paths to GatheredInformation
    const gatheredInformation = await this.convertToGatheredInformation(
      filePaths,
      context.configDir ?? process.cwd(),
    );

    return gatheredInformation;
  }

  private normalizeOptions(
    options: FilesAgentOptions,
    context: GatherContext,
  ): SourcedFileOption[] {
    return options.map((option) => {
      if (typeof option === "string") {
        return {
          path: option,
          configSource: context.configSource,
          configDir: context.configDir,
        };
      }

      return option;
    });
  }

  private async collectFilePathsWithExclusions(
    inclusionPatterns: FilePattern[],
    exclusionPatterns: FilePattern[],
  ): Promise<MatchedFilePath[]> {
    const filePathPromises = inclusionPatterns.map(async (pattern) => {
      const resolvedPattern = this.resolvePattern(pattern);
      const resolvedExclusions = exclusionPatterns.map((exclusionPattern) =>
        this.resolvePattern(exclusionPattern),
      );

      try {
        const fileStats = await stat(resolvedPattern);

        if (fileStats.isDirectory()) {
          // If it's a directory, collect all files within it
          const directoryFiles = await glob(
            path.join(resolvedPattern, "**", "*"),
            {
              nodir: true,
              ignore: [...defaultExclusions, ...resolvedExclusions],
            },
          );
          return directoryFiles.map((filePath) => ({
            filePath,
          }));
        } else {
          // If it's a file path, return it as is
          return [
            {
              filePath: resolvedPattern,
            },
          ];
        }
      } catch {
        // If the path is not a file or directory, assume it's a glob pattern
        const matchedPaths = await glob(resolvedPattern, {
          nodir: true,
          ignore: [...defaultExclusions, ...resolvedExclusions],
        });
        return matchedPaths.map((filePath) => ({
          filePath,
        }));
      }
    });

    const filePaths = await Promise.all(filePathPromises);
    return filePaths.flat();
  }

  private resolvePattern(pattern: FilePattern): string {
    if (pattern.configSource === "configFile" && pattern.configDir) {
      return path.join(pattern.configDir, pattern.pattern);
    }

    return pattern.pattern;
  }

  private async convertToGatheredInformation(
    filePaths: MatchedFilePath[],
    displayRootDir: string,
  ): Promise<GatheredInformation[]> {
    const gatheredInformationPromises = filePaths.map(async (filePath) => {
      const content = await readFile(filePath.filePath, "utf-8");

      const absoluteFilePath = path.isAbsolute(filePath.filePath)
        ? filePath.filePath
        : path.resolve(filePath.filePath);
      const displayPath = path.relative(displayRootDir, absoluteFilePath);

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

  parseOptions(options: string): string[] {
    return options.split(",");
  }

  private parsePatterns(options: SourcedFileOption[]) {
    const inclusionPatterns: FilePattern[] = [];
    const exclusionPatterns: FilePattern[] = [];

    options.forEach((option) => {
      const optionPath = option.path;

      if (optionPath.startsWith("!")) {
        exclusionPatterns.push({
          pattern: optionPath.slice(1),
          configSource: option.configSource,
          configDir: option.configDir,
        });
      } else {
        inclusionPatterns.push({
          pattern: optionPath,
          configSource: option.configSource,
          configDir: option.configDir,
        });
      }
    });

    return { inclusionPatterns, exclusionPatterns };
  }
}
