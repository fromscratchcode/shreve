const CODE_PARAM = "c";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64Url = (str: string): string =>
  btoa(String.fromCharCode(...textEncoder.encode(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (str: string): string => {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    return textDecoder.decode(
      Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)),
    );
  } catch {
    return "";
  }
};

export const encodeCode = (str: string): string => toBase64Url(str);

export const getCodeFromURL = (): string => {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get(CODE_PARAM);
  return encoded ? fromBase64Url(encoded) : "";
};

export const setCodeInURL = (code: string): void => {
  const encoded = encodeCode(code);
  const params = new URLSearchParams(window.location.search);
  params.set(CODE_PARAM, encoded);
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newURL);
};
