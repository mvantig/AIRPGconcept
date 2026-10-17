import { Fragment, type ReactNode } from "react";

// Light inline formatting for narration: *italic*, **bold**, and quoted dialogue.

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|“[^”]*”|"[^"\n]*")/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*")) out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    else out.push(<span key={key} className="dialogue">{tok}</span>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Prose({ text, dropCap, streaming }: { text: string; dropCap?: boolean; streaming?: boolean }) {
  const paragraphs = text.split(/\n{2,}|\n/).filter((p) => p.trim());
  return (
    <div className="prose-tale">
      {paragraphs.map((p, i) => (
        <p key={i} className={`${i === 0 && dropCap ? "drop-cap" : ""} ${streaming && i === paragraphs.length - 1 ? "caret" : ""}`}>
          <Fragment>{inline(p.trim(), `p${i}`)}</Fragment>
        </p>
      ))}
      {streaming && paragraphs.length === 0 && <p className="caret" />}
    </div>
  );
}
