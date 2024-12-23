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
  it("should preserve fromConfig=false for command line options", async () => {
    const agent = new TestAgent();
    const commandConfig = {
      gather: {
        test: [{ path: "some/file/path", fromConfig: false }],
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

    await gatherInformation([agent], commandConfig, configDir);

    // Verify that gather was called with fromConfig: false
    expect(agent.gather).toHaveBeenCalledWith(
      [{ path: "some/file/path", fromConfig: false }],
      { configDir, fromConfig: false },
    );
  });
});
