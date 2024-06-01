// src/fileWriter.ts
import { writeFile } from "fs/promises";

export async function writeToFile(
  filePath: string,
  content: string,
): Promise<void> {
  await writeFile(filePath, content, "utf-8");
}
