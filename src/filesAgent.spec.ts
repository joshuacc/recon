import { describe, it, expect, vi, afterEach } from "vitest";
import { FilesAgent } from "./filesAgent";
import { readFile, stat } from "fs/promises";
import { glob } from "glob";
import path from "path";

vi.mock("fs/promises");
vi.mock("glob");
vi.mock("path", () => {
  return {
    default: {
      join: vi.fn((...parts) => parts.join("/")),
      parse: vi.fn(),
      dirname: vi.fn(),
      relative: vi.fn(),
    },
  };
});

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
    expect(agent.parseOptions(options)).toEqual([
      { path: "./docs", fromConfig: false },
      { path: "./src/**/*.tsx", fromConfig: false },
    ]);
  });

  it("should gather information from a single file", async () => {
    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as any);
    vi.mocked(glob).mockImplementation(() => Promise.resolve(["file.txt"]));

    const agent = new FilesAgent();
    const files = [{ path: "./docs", fromConfig: false }];

    const expected = [
      {
        tag: "file",
        attrs: { name: "./docs" },
        content: "File content",
      },
    ];

    const result = await agent.gather(files);
    expect(result).toEqual(expected);
  });

  it("should gather information from multiple files", async () => {
    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as any);
    vi.mocked(glob).mockImplementation(() =>
      Promise.resolve(["file1.txt", "file2.txt"]),
    );

    const agent = new FilesAgent();
    const files = [
      { path: "./docs/file1", fromConfig: false },
      { path: "./docs/file2", fromConfig: false },
    ];

    const expected = [
      {
        tag: "file",
        attrs: { name: "./docs/file1" },
        content: "File content",
      },
      {
        tag: "file",
        attrs: { name: "./docs/file2" },
        content: "File content",
      },
    ];

    const result = await agent.gather(files);
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
    const files = [{ path: "./docs", fromConfig: false }];

    const expected = mockFiles.map((file) => ({
      tag: "file",
      attrs: { name: file },
      content: "File content",
    }));

    const result = await agent.gather(files);
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
    const files = [{ path: "./docs/*.txt", fromConfig: false }];

    const expected = mockFiles.map((file) => ({
      tag: "file",
      attrs: { name: file },
      content: "File content",
    }));

    const result = await agent.gather(files);
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
    const files = [{ path: "./docs/**", fromConfig: false }];

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

    const result = await agent.gather(files);
    expect(result).toEqual(expected);
  });

  it("should resolve paths relative to baseDir when provided", async () => {
    const mockFiles = ["docs/file1.txt", "docs/file2.txt"];
    const baseDir = "/config/dir";
    const inputPath = "./docs/file1.txt";

    vi.mocked(readFile).mockResolvedValue("File content");
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as any);
    vi.mocked(glob).mockResolvedValue([mockFiles[0]]);

    const agent = new FilesAgent();
    const result = await agent.gather([{ path: inputPath, fromConfig: true }], {
      configDir: baseDir,
      fromConfig: true,
    });

    // Verify path.join was called with baseDir
    expect(path.join).toHaveBeenCalledWith(baseDir, inputPath);

    // Verify the file content was read from the correct path
    expect(readFile).toHaveBeenCalledWith(`${baseDir}/${inputPath}`, "utf-8");

    expect(result).toEqual([
      {
        tag: "file",
        attrs: { name: inputPath }, // Should preserve original path in output
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
    const result = await agent.gather([{ path: inputPath, fromConfig: false }]);

    // Verify the file was read without baseDir modification
    expect(readFile).toHaveBeenCalledWith(inputPath, "utf-8");

    expect(result).toEqual([
      {
        tag: "file",
        attrs: { name: inputPath },
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
    const files = [
      { path: "docs/**", fromConfig: false },
      { path: "!docs/secret.txt", fromConfig: false },
    ];

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

    const result = await agent.gather(files);
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
    const cliResult = await agent.gather([
      { path: cliPath, fromConfig: false },
    ]);
    expect(readFile).toHaveBeenCalledWith(cliPath, "utf-8");
    expect(readFile).not.toHaveBeenCalledWith(
      `${configDir}/${cliPath}`,
      "utf-8",
    );
    expect(cliResult).toEqual([
      {
        tag: "file",
        attrs: { name: cliPath },
        content: "File content",
      },
    ]);

    vi.clearAllMocks();

    // Then test with a config path - should use configDir
    const configResult = await agent.gather(
      [{ path: cliPath, fromConfig: true }],
      { configDir, fromConfig: true },
    );
    expect(readFile).toHaveBeenCalledWith(`${configDir}/${cliPath}`, "utf-8");
    expect(configResult).toEqual([
      {
        tag: "file",
        attrs: { name: cliPath },
        content: "File content",
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
