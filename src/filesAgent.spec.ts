import { describe, it, expect, vi, afterEach } from "vitest";
import { FilesAgent } from "./filesAgent";
import { readFile, stat } from "fs/promises";
import { glob } from "glob";
import path from "path";

vi.mock("fs/promises");
vi.mock("glob");

describe("FilesAgent", () => {
  // Unmocked list of default exclusions to match what is in the actual code
  const mockDefaultExclusions = [
    "**/.git/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
  ];

  it("should have correct name and description", () => {
    const agent = new FilesAgent();
    expect(agent.name).toBe("files");
    expect(agent.description).toBe("Gathers information from files");
  });

  it("should properly parse options string", () => {
    const agent = new FilesAgent();
    const options = "./docs,./src/**/*.tsx";
    expect(agent.parseOptions(options)).toEqual(["./docs", "./src/**/*.tsx"]);
  });

  it("should gather information from a single file", async () => {
    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as any);
    vi.mocked(glob).mockImplementation(() => Promise.resolve(["file.txt"]));

    const agent = new FilesAgent();
    const files = ["./docs"];

    const expected = [
      {
        tag: "file",
        attrs: { name: "docs" },
        content: "File content",
      },
    ];

    const result = await agent.gather(files, { configSource: "cli" });
    expect(result).toEqual(expected);
  });

  it("should gather information from multiple files", async () => {
    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as any);
    vi.mocked(glob).mockImplementation(() =>
      Promise.resolve(["file1.txt", "file2.txt"]),
    );

    const agent = new FilesAgent();
    const files = ["./docs/file1", "./docs/file2"];

    const expected = [
      {
        tag: "file",
        attrs: { name: "docs/file1" },
        content: "File content",
      },
      {
        tag: "file",
        attrs: { name: "docs/file2" },
        content: "File content",
      },
    ];

    const result = await agent.gather(files, { configSource: "cli" });
    expect(result).toEqual(expected);
  });

  it("should handle directories and gather information from files within", async () => {
    const mockFiles = ["file1.txt", "file2.txt"];
    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => true } as any);
    vi.mocked(glob).mockImplementation(() =>
      Promise.resolve(
        mockFiles.filter((file) => !mockDefaultExclusions.includes(file)),
      ),
    );

    const agent = new FilesAgent();
    const files = ["./docs"];

    const expected = mockFiles.map((file) => ({
      tag: "file",
      attrs: { name: file },
      content: "File content",
    }));

    const result = await agent.gather(files, { configSource: "cli" });
    expect(result).toEqual(expected);
  });

  it("should handle glob patterns and gather information from matched files", async () => {
    const mockFiles = ["file1.txt", "file2.txt"];
    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockImplementation(
      (path) =>
        Promise.reject(new Error(`No such file or directory: ${path}`)) as any,
    );
    vi.mocked(glob).mockImplementation(() =>
      Promise.resolve(
        mockFiles.filter((file) => !mockDefaultExclusions.includes(file)),
      ),
    );

    const agent = new FilesAgent();
    const files = ["./docs/*.txt"];

    const expected = mockFiles.map((file) => ({
      tag: "file",
      attrs: { name: file },
      content: "File content",
    }));

    const result = await agent.gather(files, { configSource: "cli" });
    expect(result).toEqual(expected);
  });

  it("should handle exclude patterns correctly", async () => {
    const mockFiles = [
      "file1.txt",
      "file2.txt",
      ".git/HEAD",
      "node_modules/package.json",
    ];
    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockImplementation(
      (path) =>
        Promise.reject(new Error(`No such file or directory: ${path}`)) as any,
    );
    vi.mocked(glob).mockImplementation(() =>
      Promise.resolve(
        mockFiles.filter((file) => !mockDefaultExclusions.includes(file)),
      ),
    );

    const agent = new FilesAgent();
    const files = ["./docs/**"];

    const expected = mockFiles
      .filter(
        (file) =>
          !mockDefaultExclusions.some((exclusion) => file.includes(exclusion)),
      )
      .map((file) => ({
        tag: "file",
        attrs: { name: file },
        content: "File content",
      }));

    const result = await agent.gather(files, { configSource: "cli" });
    expect(result).toEqual(expected);
  });

  it("should resolve paths relative to baseDir when provided", async () => {
    const baseDir = "/config/dir";
    const inputPath = "./docs/file1.txt";
    const resolvedPath = path.join(baseDir, inputPath);

    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as any);
    vi.mocked(glob).mockResolvedValue([resolvedPath]);

    const agent = new FilesAgent();
    const result = await agent.gather([inputPath], {
      configDir: baseDir,
      configSource: "configFile",
    });

    // Verify the file content was read from the correct path
    expect(readFile).toHaveBeenCalledWith(resolvedPath, "utf-8");

    expect(result).toEqual([
      {
        tag: "file",
        attrs: { name: "docs/file1.txt" },
        content: "File content",
      },
    ]);
  });

  it("should use raw paths when no baseDir is provided", async () => {
    const mockFiles = ["docs/file1.txt"];
    const inputPath = "./docs/file1.txt";

    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as any);
    vi.mocked(glob).mockResolvedValue([mockFiles[0]]);

    const agent = new FilesAgent();
    const result = await agent.gather([inputPath], { configSource: "cli" });

    // Verify the file was read without baseDir modification
    expect(readFile).toHaveBeenCalledWith(inputPath, "utf-8");

    expect(result).toEqual([
      {
        tag: "file",
        attrs: { name: "docs/file1.txt" },
        content: "File content",
      },
    ]);
  });

  it("should handle exclude patterns starting with an exclamation point correctly", async () => {
    const mockFiles = ["docs/file1.txt", "docs/file2.txt", "docs/secret.txt"];

    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockImplementation(
      (path) =>
        Promise.reject(new Error(`No such file or directory: ${path}`)) as any,
    );

    vi.mocked(glob).mockImplementation((pattern, options) => {
      const ignorePatterns = (options.ignore || []) as string[];
      return Promise.resolve(
        mockFiles.filter((filePath) => {
          // Check if the file should be excluded
          return !ignorePatterns.some((ignorePattern) => {
            if (ignorePattern.startsWith("!")) {
              return !filePath.includes(ignorePattern.slice(1));
            }
            return filePath.includes(ignorePattern);
          });
        }),
      );
    });

    const agent = new FilesAgent();
    const files = ["docs/**", "!docs/secret.txt"];

    const expected = [
      {
        tag: "file",
        attrs: { name: "docs/file1.txt" },
        content: "File content",
      },
      {
        tag: "file",
        attrs: { name: "docs/file2.txt" },
        content: "File content",
      },
    ];

    const result = await agent.gather(files, { configSource: "cli" });
    expect(result).toEqual(expected);
  });

  // New test to demonstrate the bug with command line paths being treated relative to config dir
  it("should not resolve command line paths relative to config dir", async () => {
    const mockFiles = ["docs/file1.txt"];
    const configDir = "/config/dir";
    const cliPath = "./docs/file1.txt";

    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as any);
    vi.mocked(glob).mockResolvedValue([mockFiles[0]]);

    const agent = new FilesAgent();
    // First test with a command line path - should not use configDir
    const cliResult = await agent.gather([cliPath], { configSource: "cli" });
    expect(readFile).toHaveBeenCalledWith(cliPath, "utf-8");
    expect(readFile).not.toHaveBeenCalledWith(
      `${configDir}/${cliPath}`,
      "utf-8",
    );
    expect(cliResult).toEqual([
      {
        tag: "file",
        attrs: { name: "docs/file1.txt" },
        content: "File content",
      },
    ]);

    vi.clearAllMocks();

    // Then test with a config path - should use configDir
    const configResult = await agent.gather([cliPath], {
      configDir,
      configSource: "configFile",
    });
    expect(readFile).toHaveBeenCalledWith(
      path.join(configDir, cliPath),
      "utf-8",
    );
    expect(configResult).toEqual([
      {
        tag: "file",
        attrs: { name: "docs/file1.txt" },
        content: "File content",
      },
    ]);
  });

  it("should display expanded config glob matches relative to config dir", async () => {
    const configDir = "/config";

    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => true } as any);
    vi.mocked(glob).mockResolvedValue([
      "/config/docs/file1.txt",
      "/config/docs/file2.txt",
    ]);

    const agent = new FilesAgent();
    const result = await agent.gather(["./docs"], {
      configDir,
      configSource: "configFile",
    });

    expect(result).toEqual([
      {
        tag: "file",
        attrs: { name: "docs/file1.txt" },
        content: "File content",
      },
      {
        tag: "file",
        attrs: { name: "docs/file2.txt" },
        content: "File content",
      },
    ]);
  });

  it("should preserve source-specific path resolution for mixed file options", async () => {
    const configDir = "/config";
    const expectedCliDisplayPath = path.relative(
      configDir,
      path.resolve("./local.md"),
    );

    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockImplementation(async (filePath) => {
      if (filePath === "/config/docs") {
        return { isDirectory: () => true } as any;
      }

      if (filePath === "./local.md") {
        return { isDirectory: () => false } as any;
      }

      throw new Error(`Unexpected stat path: ${String(filePath)}`);
    });
    vi.mocked(glob).mockResolvedValue(["/config/docs/a.md"]);

    const agent = new FilesAgent();
    const result = await agent.gather(
      [
        { path: "./docs", configSource: "configFile", configDir },
        { path: "./local.md", configSource: "cli" },
      ],
      { configDir, configSource: "cli" },
    );

    expect(result).toEqual([
      {
        tag: "file",
        attrs: { name: "docs/a.md" },
        content: "File content",
      },
      {
        tag: "file",
        attrs: { name: expectedCliDisplayPath },
        content: "File content",
      },
    ]);

    expect(readFile).toHaveBeenCalledWith("/config/docs/a.md", "utf-8");
    expect(readFile).toHaveBeenCalledWith("./local.md", "utf-8");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
