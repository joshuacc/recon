import { describe, it, expect, vi, afterEach } from "vitest";
import { FilesAgent } from "./filesAgent";
import { readFile, stat } from "fs/promises";
import { glob } from "glob";

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
    const files = ["./docs/file1", "./docs/file2"];

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
    const files = ["./docs"];

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
    const files = ["./docs/*.txt"];

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

    const result = await agent.gather(files);
    expect(result).toEqual(expected);
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

    const result = await agent.gather(files);
    expect(result).toEqual(expected);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
