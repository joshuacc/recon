import { describe, expect, it, vi } from "vitest";
import { PassThrough } from "stream";
import { setupBrokenPipeHandler } from "./setupBrokenPipeHandler";

describe("setupBrokenPipeHandler", () => {
  it("should exit cleanly on EPIPE errors", () => {
    const stream = new PassThrough() as unknown as NodeJS.WriteStream;
    const exit = vi.fn();

    setupBrokenPipeHandler(stream, exit);

    const error = Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
    stream.emit("error", error);

    expect(exit).toHaveBeenCalledWith(0);
  });

  it("should rethrow non-EPIPE stream errors", () => {
    const stream = new PassThrough() as unknown as NodeJS.WriteStream;
    setupBrokenPipeHandler(stream);

    const error = Object.assign(new Error("socket failure"), {
      code: "ECONNRESET",
    });

    expect(() => stream.emit("error", error)).toThrow("socket failure");
  });
});
