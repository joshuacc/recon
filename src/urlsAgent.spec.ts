import { describe, it, expect, afterEach, vi } from "vitest";
import { UrlsAgent } from "./urlsAgent";
import { GatheredInformation } from "./reconAgent";

global.fetch = vi.fn();

describe("UrlsAgent", () => {
  it("should have correct name and description", () => {
    const agent = new UrlsAgent();
    expect(agent.name).toBe("urls");
    expect(agent.description).toBe("Gathers information from URLs");
  });

  it("should properly parse options string", () => {
    const agent = new UrlsAgent();
    const options = "https://example.com,https://another.com";
    expect(agent.parseOptions(options)).toEqual([
      "https://example.com",
      "https://another.com",
    ]);
  });

  it("should gather information from multiple URLs", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      return {
        async text() {
          return `Content from ${url}`;
        },
      } as Response;
    });

    const agent = new UrlsAgent();
    const urls = ["https://example.com", "https://another.com"];

    const expected: GatheredInformation[] = [
      {
        tag: "urls",
        attrs: {},
        content:
          "Content from https://example.com\nContent from https://another.com",
      },
    ];

    const result = await agent.gather(urls);
    expect(result).toEqual(expected);
  });

  it("should handle fetch errors gracefully", async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      throw new Error("Fetch failed");
    });

    const agent = new UrlsAgent();
    const urls = ["https://example.com"];

    await expect(agent.gather(urls)).rejects.toThrow("Fetch failed");
  });

  it("should combine contents into a single GatheredInformation object", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      return {
        async text() {
          return `Content from ${url}`;
        },
      } as Response;
    });

    const agent = new UrlsAgent();
    const urls = ["https://example.com", "https://another.com"];

    const result = await agent.gather(urls);
    expect(result.length).toBe(1);
    expect(result[0].content).toContain("Content from https://example.com");
    expect(result[0].content).toContain("Content from https://another.com");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
