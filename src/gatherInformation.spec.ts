import { describe, it, expect, vi } from "vitest";
import { gatherInformation } from "./gatherInformation";
import { ReconAgent } from "./reconAgent";

class TestAgent implements ReconAgent<string[]> {
  readonly name = "test";
  readonly description = "Test agent";
  gather = vi.fn();
  parseOptions = vi.fn();
}

describe("gatherInformation", () => {
  it("should preserve configSource='cli' for command line options", async () => {
    const agent = new TestAgent();
    const commandConfig = {
      gather: {
        test: [{ path: "some/file/path", configSource: "cli" }],
      },
    };
    const configDir = "/config/dir";

    agent.gather.mockResolvedValue([
      {
        tag: "test",
        attrs: {},
        content: "test content",
      },
    ]);

    const optionsSourceMap: Record<string, "configFile" | "cli"> = {
      test: "cli",
    }; // Example map for testing
    await gatherInformation(
      [agent],
      commandConfig,
      optionsSourceMap,
      configDir,
    );

    // Verify that gather was called with configSource: 'cli'
    expect(agent.gather).toHaveBeenCalledWith(
      [{ path: "some/file/path", configSource: "cli" }],
      { configDir, configSource: "cli" },
    );
  });
});
