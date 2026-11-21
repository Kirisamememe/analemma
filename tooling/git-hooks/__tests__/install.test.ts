import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const INSTALL = join(import.meta.dirname, "..", "install.ts");
const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-install-"));

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const makeDirectory = (name: string): string => {
  const directory = join(temporaryRoot, name);

  mkdirSync(directory, { recursive: true });

  return directory;
};

const install = (cwd: string) =>
  spawnSync("bun", [INSTALL], { cwd, encoding: "utf8" });

const hooksPath = (cwd: string): string =>
  spawnSync("git", ["config", "--get", "core.hooksPath"], {
    cwd,
    encoding: "utf8",
  }).stdout.trim();

describe("hook を入れること", () => {
  test("git のリポジトリでは、core.hooksPath を hook のフォルダにすること", () => {
    const root = makeDirectory("repository");

    spawnSync("git", ["init", "--quiet"], { cwd: root });

    const first = install(root);
    const second = install(root);

    expect(first.status).toBe(0);
    expect(hooksPath(root)).toBe("tooling/git-hooks");
    expect(second).toMatchObject({ status: 0, stdout: "", stderr: "" });
  });

  test("パッケージの直下が git のリポジトリの直下でなければ、何もしないこと", () => {
    const root = makeDirectory("parent");
    const nested = makeDirectory("parent/extracted-package");

    spawnSync("git", ["init", "--quiet"], { cwd: root });

    expect(install(nested)).toMatchObject({
      status: 0,
      stdout: "",
      stderr: "",
    });
    expect(hooksPath(root)).toBe("");
  });

  test("git のリポジトリの外では、何もせずに終わること", () => {
    expect(install(makeDirectory("outside"))).toMatchObject({
      status: 0,
      stdout: "",
      stderr: "",
    });
  });
});
