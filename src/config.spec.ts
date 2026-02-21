import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { loadConfig } from "./config";

describe("loadConfig", () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();

    await Promise.all(
      tempRoots
        .splice(0)
        .map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })),
    );
  });

  it("should track command config directories with project precedence", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "recon-config-"));
    tempRoots.push(tempRoot);

    const homeDir = path.join(tempRoot, "home");
    const projectDir = path.join(tempRoot, "project");
    const nestedProjectDir = path.join(projectDir, "nested", "cwd");

    await fs.mkdir(homeDir, { recursive: true });
    await fs.mkdir(nestedProjectDir, { recursive: true });

    await fs.writeFile(
      path.join(homeDir, ".recon.config.mjs"),
      `export default {
  commands: {
    homeOnly: {
      gather: {
        files: ["./home.md"],
      },
    },
    shared: {
      gather: {
        files: ["./home-shared.md"],
      },
    },
  },
};`,
    );

    await fs.writeFile(
      path.join(projectDir, ".recon.config.mjs"),
      `export default {
  commands: {
    projectOnly: {
      gather: {
        files: ["./project.md"],
      },
    },
    shared: {
      gather: {
        files: ["./project-shared.md"],
      },
    },
  },
};`,
    );

    vi.spyOn(os, "homedir").mockReturnValue(homeDir);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.spyOn(process, "cwd").mockReturnValue(nestedProjectDir);

    const { config, commandConfigDirs, defaultConfigDir } = await loadConfig();

    expect(config.commands?.homeOnly.gather).toEqual({
      files: ["./home.md"],
    });
    expect(config.commands?.projectOnly.gather).toEqual({
      files: ["./project.md"],
    });
    expect(config.commands?.shared.gather).toEqual({
      files: ["./project-shared.md"],
    });

    expect(commandConfigDirs).toEqual({
      homeOnly: homeDir,
      projectOnly: projectDir,
      shared: projectDir,
    });
    expect(defaultConfigDir).toBe(projectDir);

    expect(warnSpy).toHaveBeenCalledWith(
      'Warning: Command "shared" is defined in both config files. The command from the project-level config will be used.',
    );
  });
});
