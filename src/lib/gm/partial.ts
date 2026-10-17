/**
 * Pull the value of a top-level string field out of a JSON document that is still
 * streaming in, so narration can be shown word by word before the JSON closes.
 * Returns null until the field has started.
 */
export function partialStringField(json: string, field: string): string | null {
  const key = `"${field}"`;
  let at = json.indexOf(key);
  if (at < 0) return null;
  at += key.length;
  while (at < json.length && /\s/.test(json[at])) at++;
  if (json[at] !== ":") return null;
  at++;
  while (at < json.length && /\s/.test(json[at])) at++;
  if (json[at] !== '"') return null;
  at++;

  let out = "";
  while (at < json.length) {
    const ch = json[at];
    if (ch === '"') return out;
    if (ch !== "\\") {
      out += ch;
      at++;
      continue;
    }
    const next = json[at + 1];
    if (next === undefined) return out; // escape cut off mid-stream
    const simple: Record<string, string> = { n: "\n", t: "\t", r: "", b: "", f: "", '"': '"', "\\": "\\", "/": "/" };
    if (next in simple) {
      out += simple[next];
      at += 2;
      continue;
    }
    if (next === "u") {
      const hex = json.slice(at + 2, at + 6);
      if (hex.length < 4) return out;
      out += String.fromCharCode(parseInt(hex, 16));
      at += 6;
      continue;
    }
    at += 2;
  }
  return out;
}
