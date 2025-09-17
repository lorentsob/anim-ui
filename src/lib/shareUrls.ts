import { getStoredStateSnapshot } from "@/store/useEditor";

export const STATE_PARAM = "state";

const toBase64Url = (input: string) => {
  if (typeof window !== "undefined" && window.btoa) {
    const base64 = window.btoa(encodeURIComponent(input));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  return Buffer.from(input, "utf-8").toString("base64url");
};

const fromBase64Url = (encoded: string) => {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof window !== "undefined" && window.atob) {
    const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = window.atob(padded);
    return decodeURIComponent(decoded);
  }
  return Buffer.from(encoded, "base64url").toString("utf-8");
};

export function encodeEditorState(): string {
  const snapshot = getStoredStateSnapshot();
  return toBase64Url(JSON.stringify(snapshot));
}

export function decodeEditorState(encoded?: string | null): unknown {
  if (!encoded) return null;
  try {
    const json = fromBase64Url(encoded);
    return JSON.parse(json);
  } catch (error) {
    console.warn("Failed to decode editor state", error);
    return null;
  }
}

export function createShareUrl(): string {
  const encoded = encodeEditorState();
  const base = typeof window !== "undefined" ? window.location.href : "http://localhost";
  const url = new URL(base);
  url.searchParams.set(STATE_PARAM, encoded);
  return url.toString();
}
