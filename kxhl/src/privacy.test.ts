import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateAiMessage } from "../functions/lib/chat.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const invite = /chat\.whatsapp\.com\/[A-Za-z0-9]+/;
const textExt = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".py",
  ".md",
  ".json",
  ".txt",
  ".html",
  ".css",
  ".ipynb",
  ".toml",
  ".sh",
  ".yml",
  ".yaml",
]);

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules" || name === "dist" || name === ".venv") {
      continue;
    }
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
}

test("the raw WhatsApp export is not in the tree", () => {
  assert.equal(existsSync(join(repoRoot, "kxhl/public/chat-data/chat.txt")), false);
  assert.equal(existsSync(join(repoRoot, "projects/makemore/gpt/chat.txt")), false);

  const files: string[] = [];
  walk(repoRoot, files);
  for (const file of files) {
    if (!textExt.has(extname(file))) continue;
    const text = readFileSync(file, "utf8");
    assert.equal(invite.test(text), false, file);
  }
});

test("the model vocabulary is characters, not the transcript", () => {
  const vocab = JSON.parse(
    readFileSync(join(repoRoot, "projects/makemore/gpt/vocab.json"), "utf8"),
  ) as unknown[];
  assert.ok(vocab.length > 0);
  for (const token of vocab) {
    assert.equal(typeof token, "string");
    assert.ok((token as string).length <= 2);
  }
  const encoded = JSON.stringify(vocab);
  assert.equal(invite.test(encoded), false);
  assert.equal(/\d{6,}/.test(encoded), false);
});

test("chat generation does not read the export", async () => {
  const samples = await Promise.all(
    Array.from({ length: 20 }, () => generateAiMessage()),
  );
  for (const message of samples) {
    assert.ok(message);
    assert.equal(invite.test(message.content), false);
    assert.equal(invite.test(message.sender), false);
    assert.equal(/\d{6,}/.test(message.content), false);
  }
});
