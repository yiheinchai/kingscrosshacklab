/** Canonical public origin for KXHL Chat. Production traffic always lands here. */
export const CANONICAL_CHAT_ORIGIN = "https://chat.kxhacklab.com";
export const CANONICAL_CHAT_HOST = "chat.kxhacklab.com";

export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "chat.localhost" ||
    hostname.endsWith(".localhost")
  );
}

export function isCanonicalChatHost(hostname: string): boolean {
  return hostname === CANONICAL_CHAT_HOST;
}

/** True when this host should render the chat app (canonical subdomain or local stand-in). */
export function shouldServeChatApp(hostname: string, pathname: string): boolean {
  if (isCanonicalChatHost(hostname) || hostname === "chat.localhost") {
    return true;
  }
  // Local Vite: keep the marketing site on `/` and the chat UI on `/chat`.
  return (
    isLocalHostname(hostname) &&
    (pathname === "/chat" || pathname.startsWith("/chat/"))
  );
}

/** True when a chat URL on this host should 301/replace to the canonical origin. */
export function shouldRedirectChatToCanonical(hostname: string): boolean {
  return !isCanonicalChatHost(hostname) && !isLocalHostname(hostname);
}

export function canonicalChatUrl(search = "", hash = ""): string {
  const origin = CANONICAL_CHAT_ORIGIN.endsWith("/")
    ? CANONICAL_CHAT_ORIGIN.slice(0, -1)
    : CANONICAL_CHAT_ORIGIN;
  return `${origin}/${search}${hash}`;
}
