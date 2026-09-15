import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_CHAT_HOST,
  CANONICAL_CHAT_ORIGIN,
  canonicalChatUrl,
  isCanonicalChatHost,
  isLocalHostname,
  shouldRedirectChatToCanonical,
  shouldServeChatApp,
} from "./chatHost.ts";

test("canonical host is chat.kxhacklab.com", () => {
  assert.equal(CANONICAL_CHAT_HOST, "chat.kxhacklab.com");
  assert.equal(CANONICAL_CHAT_ORIGIN, "https://chat.kxhacklab.com");
  assert.equal(isCanonicalChatHost("chat.kxhacklab.com"), true);
  assert.equal(isCanonicalChatHost("kxhacklab.com"), false);
  assert.equal(isCanonicalChatHost("chat.pages.dev"), false);
});

test("chat app is served only on the canonical host in production", () => {
  assert.equal(shouldServeChatApp("chat.kxhacklab.com", "/"), true);
  assert.equal(shouldServeChatApp("chat.kxhacklab.com", "/chat"), true);
  assert.equal(shouldServeChatApp("kxhacklab.com", "/"), false);
  assert.equal(shouldServeChatApp("kxhacklab.com", "/chat"), false);
  assert.equal(shouldServeChatApp("www.kxhacklab.com", "/chat"), false);
  assert.equal(shouldServeChatApp("kingscrosshacklab.pages.dev", "/chat"), false);
  assert.equal(shouldServeChatApp("chat.pages.dev", "/"), false);
});

test("local development can still open /chat", () => {
  assert.equal(shouldServeChatApp("localhost", "/"), false);
  assert.equal(shouldServeChatApp("localhost", "/chat"), true);
  assert.equal(shouldServeChatApp("127.0.0.1", "/chat"), true);
  assert.equal(shouldServeChatApp("chat.localhost", "/"), true);
});

test("non-canonical production hosts redirect chat to the canonical origin", () => {
  assert.equal(shouldRedirectChatToCanonical("kxhacklab.com"), true);
  assert.equal(shouldRedirectChatToCanonical("kingscrosshacklab.pages.dev"), true);
  assert.equal(shouldRedirectChatToCanonical("chat.kxhacklab.com"), false);
  assert.equal(shouldRedirectChatToCanonical("localhost"), false);
  assert.equal(canonicalChatUrl(), "https://chat.kxhacklab.com/");
  assert.equal(canonicalChatUrl("?m=kxhl-1", "#latest"), "https://chat.kxhacklab.com/?m=kxhl-1#latest");
});

test("isLocalHostname covers loopback names", () => {
  assert.equal(isLocalHostname("localhost"), true);
  assert.equal(isLocalHostname("[::1]"), true);
  assert.equal(isLocalHostname("kxhacklab.com"), false);
});
