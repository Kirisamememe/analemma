import { expect, test } from "bun:test";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PREPARE = join(import.meta.dirname, "../prepare.ts");

const runPrepare = (env: Record<string, string | undefined>) => {
  const result = Bun.spawnSync([process.execPath, "--no-env-file", PREPARE], {
    env,
    stdout: "pipe",
    stderr: "pipe",
  });

  return {
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
};

const FAKE_DOCKER = `#!/bin/sh
printf '%s\\n' "$@" > "$FAKE_DOCKER_ARGS"
count=0
[ -f "$FAKE_DOCKER_COUNT" ] && read -r count < "$FAKE_DOCKER_COUNT"
count=$((count + 1))
echo "$count" > "$FAKE_DOCKER_COUNT"
if [ "$count" -le "$FAKE_DOCKER_FAILURES" ]; then
  echo "偽の docker の失敗 $count" >&2
  exit 1
fi
`;

const withFakeDocker = async (failures: number) => {
  const folder = await mkdtemp(join(tmpdir(), "analemma-fake-docker-"));
  const count = join(folder, "count");
  const args = join(folder, "args");

  await writeFile(join(folder, "docker"), FAKE_DOCKER);
  await chmod(join(folder, "docker"), 0o755);

  return {
    run: () =>
      runPrepare({
        PATH: folder,
        FAKE_DOCKER_COUNT: count,
        FAKE_DOCKER_ARGS: args,
        FAKE_DOCKER_FAILURES: String(failures),
      }),
    attempts: async () => Number((await readFile(count, "utf8")).trim()),
    args: async () => (await readFile(args, "utf8")).trimEnd().split("\n"),
    [Symbol.asyncDispose]: async () => rm(folder, { recursive: true }),
  };
};

test("docker コマンドが無いと、Docker が要ることを伝えて失敗すること", () => {
  const result = runPrepare({ PATH: "/nonexistent" });

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("テストには Docker が要る");
});

test("Docker に接続できないと、Docker に接続できるか確かめるよう伝えて失敗すること", () => {
  const result = runPrepare({
    ...Bun.env,
    DOCKER_HOST: "unix:///nonexistent/docker.sock",
  });

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("Docker に接続できるかを確かめて");
});

test("起動する前に、時間がかかりうることを1行で伝えること", () => {
  const result = runPrepare({ PATH: "/nonexistent" });

  expect(result.stdout).toContain("テスト用の PostgreSQL を起動する");
});

test(
  "起動に2回失敗しても、3回目で起動できれば成功すること",
  async () => {
    await using docker = await withFakeDocker(2);
    const result = docker.run();

    expect(result.exitCode).toBe(0);
    expect(await docker.attempts()).toBe(3);
    expect((await docker.args()).join(" ")).toContain("compose --file");
    expect((await docker.args()).join(" ")).toContain(
      "--project-name analemma",
    );
  },
  { timeout: 15_000 },
);

test(
  "起動に3回とも失敗したら、最後の出力と文言を出して失敗すること",
  async () => {
    await using docker = await withFakeDocker(3);
    const result = docker.run();

    expect(result.exitCode).toBe(1);
    expect(await docker.attempts()).toBe(3);
    expect(result.stderr).toContain("偽の docker の失敗 3");
    expect(result.stderr).not.toContain("偽の docker の失敗 2");
    expect(result.stderr).toContain("Docker Compose で起動できなかった");
  },
  { timeout: 15_000 },
);
