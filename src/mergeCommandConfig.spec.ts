import { describe, expect, it } from "vitest";
import { FilesAgent } from "./filesAgent";
import { UrlsAgent } from "./urlsAgent";
import { mergeCommandConfigWithCli } from "./mergeCommandConfig";

describe("mergeCommandConfigWithCli", () => {
  it("should merge config and CLI gather options while preserving file option sources", () => {
    const commandConfig = {
      prompt: "config prompt",
      gather: {
        files: ["./config-docs"],
        urls: ["https://config.example.com"],
        notes: "Config note",
      },
    };

    const result = mergeCommandConfigWithCli(
      commandConfig,
      {
        prompt: "cli prompt",
        files: "./cli-doc.md",
        urls: "https://cli.example.com",
      },
      new FilesAgent(),
      new UrlsAgent(),
      "/tmp/project",
    );

    expect(result.mergedConfig.prompt).toBe("cli prompt");
    expect(result.mergedConfig.gather.files).toEqual([
      {
        path: "./config-docs",
        configSource: "configFile",
        configDir: "/tmp/project",
      },
      {
        path: "./cli-doc.md",
        configSource: "cli",
      },
    ]);
    expect(result.mergedConfig.gather.urls).toEqual([
      "https://config.example.com",
      "https://cli.example.com",
    ]);
    expect(result.optionsSourceMap).toEqual({
      files: "configFile",
      urls: "configFile",
      notes: "configFile",
    });
  });

  it("should parse CLI-only gather options and mark their source as cli", () => {
    const commandConfig = {
      gather: {},
    };

    const result = mergeCommandConfigWithCli(
      commandConfig,
      {
        files: "./cli-1.md,./cli-2.md",
        urls: "https://one.example.com,https://two.example.com",
      },
      new FilesAgent(),
      new UrlsAgent(),
    );

    expect(result.mergedConfig.gather.files).toEqual([
      {
        path: "./cli-1.md",
        configSource: "cli",
      },
      {
        path: "./cli-2.md",
        configSource: "cli",
      },
    ]);
    expect(result.mergedConfig.gather.urls).toEqual([
      "https://one.example.com",
      "https://two.example.com",
    ]);
    expect(result.optionsSourceMap).toEqual({
      files: "cli",
      urls: "cli",
    });
  });
});
