#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const STORE =
  process.env.SHOPIFY_FLAG_STORE ||
  process.env.STORE ||
  "mm0afk-rw.myshopify.com";

export function shopifyExecute(query, variables, { mutations = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "shopify-exec-"));
  const queryFile = join(dir, "op.graphql");
  const varsFile = join(dir, "vars.json");
  writeFileSync(queryFile, query);
  if (variables) writeFileSync(varsFile, JSON.stringify(variables));

  const args = [
    "store",
    "execute",
    "--store",
    STORE,
    "--json",
    "--query-file",
    queryFile,
  ];
  if (variables) args.push("--variable-file", varsFile);
  if (mutations) args.push("--allow-mutations");

  const env = {
    ...process.env,
    PATH: `${process.env.HOME}/.npm-global/bin:${process.env.PATH}`,
    SHOPIFY_CLI_AGENT_INFO:
      process.env.SHOPIFY_CLI_AGENT_INFO ||
      "n:cursor|v:none|p:xai|m:cursor-grok-4.6-high",
    SHOPIFY_CLI_AGENT_IDS:
      process.env.SHOPIFY_CLI_AGENT_IDS ||
      "s:bc-4ce469b5-c618-49ee-b7a3-4c807fd63629|r:bc-4ce469b5-c618-49ee-b7a3-4c807fd63629",
  };

  const result = spawnSync("shopify", args, {
    encoding: "utf8",
    env,
    maxBuffer: 10 * 1024 * 1024,
  });
  rmSync(dir, { recursive: true, force: true });

  if (result.status !== 0) {
    const err = result.stderr || result.stdout || `exit ${result.status}`;
    throw new Error(err);
  }

  const stdout = (result.stdout || "").trim();
  const jsonStart = stdout.indexOf("{");
  const parsed = JSON.parse(jsonStart >= 0 ? stdout.slice(jsonStart) : stdout);
  if (parsed.errors) {
    throw new Error(JSON.stringify(parsed.errors, null, 2));
  }
  return parsed;
}
