export function setupBrokenPipeHandler(
  stream: NodeJS.WriteStream,
  exit: (code: number) => void = process.exit,
): void {
  stream.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EPIPE") {
      exit(0);
      return;
    }

    throw error;
  });
}
