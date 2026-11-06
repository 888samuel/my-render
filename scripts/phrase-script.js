/**
 * Split a crowded Tigrinya script into short spoken lines for timestamping.
 *
 *   node scripts/phrase-script.js script.docx
 *   node scripts/phrase-script.js script.docx phrases.txt
 *   node scripts/phrase-script.js script.txt --stdout
 *
 * Writes <name>.phrases.txt and <name>.phrases.docx. Each spoken line is one
 * paragraph in the Word file. A long pause is one empty paragraph.
 *
 * The source wording is preserved. Lines are split at pauses, conjunctions,
 * clause openings, and places where Tigrinya and English are separate beats.
 * A line holds 3 to 5 words. It is shorter only when the beat itself is shorter
 * (a name, a conjunction, or a pause). Nothing is rewritten, translated, or dropped.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const MAX_WORDS = 5;
const MIN_WORDS = 3;
const CLAUSE_MIN = 2;
const WEAK_MIN = 4;

/** Conjunctions. Lookup only — source spelling is never replaced. */
const STRONG_OPEN = new Set([
  "ግን",
  "ግና",
  "ስለዚ",
  "ስለዚህ",
  "እንተኾነ",
  "እንተኮነ",
  "እንተዘይኮይኑ",
  "እንተዘይኮነ",
  "ወይ",
  "ወይስ",
  "ወይድማ",
  "ምኽንያቱ",
  "ምክንያቱ",
  "ብምኽንያት",
  "ብምክንያት",
  "ንምዃኑ",
  "ማለት",
  "ብኣንጻሩ",
  "ብተወሳኺ",
  "በተወሳኺ",
  "ከምኡውን",
  "እንተድኣ",
  "እንተድአ",
  "እንተ",
  "but",
  "because",
  "however",
  "so",
]);

/** Demonstratives that often open a new breath after a phrase is already underway. */
const DEMO_OPEN = new Set([
  "እቲ",
  "እታ",
  "እቶም",
  "እተን",
  "እዚ",
  "እዛ",
  "እዚኣ",
  "እዚአ",
  "እዚኦም",
  "እዚአን",
  "እዞም",
  "እዘን",
  "ነቲ",
  "ነታ",
  "ነቶም",
  "ነተን",
  "ነዚ",
  "ነዛ",
  "ነዞም",
  "ነዘን",
]);

const CLAUSE_PAIRS = [
  ["ወይ", "ድማ"],
  ["ኣብ", "ክንድኡ"],
  ["በዚ", "ምኽንያት"],
  ["በዚ", "ምክንያት"],
  ["ከምኡ", "ውን"],
  ["ስለ", "ዚ"],
  ["ስለ", "ዚህ"],
  ["or", "else"],
];

/** Prepositions. A line may start with one; it should not end on one. */
const DANGLING = new Set([
  "ኣብ",
  "ካብ",
  "ናብ",
  "ናይ",
  "ምስ",
  "ብ",
  "ን",
  "ከም",
  "ብዛዕባ",
  "ውሽጢ",
  "ላዕሊ",
  "ትሕቲ",
  "ቅድሚ",
  "ድሕሪ",
  "ክሳብ",
]);

/** Used only when a line is already long and still has no comma or clause break. */
const LONG_SPLIT = new Set([
  ...DANGLING,
  "ከምቲ",
  "ከምዚ",
  "እንከሎ",
  "እንዳ",
  "and",
  "while",
  "when",
  "which",
  "with",
]);

/** A one-word line of these joins the next beat instead of sitting alone. */
const GLUE = new Set([
  "ወይ",
  "ወይስ",
  "ኣብ",
  "ካብ",
  "ናብ",
  "ናይ",
  "ምስ",
  "ብ",
  "ን",
  "ከም",
  "or",
]);

const OPENERS = new Set(['"', "'", "(", "[", "{", "“", "«"]);

function hasEthiopicLetter(text) {
  return /[\u1200-\u135F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/.test(text);
}

function hasLatin(text) {
  return /[A-Za-z]/.test(text);
}

function spokenScript(text) {
  const ti = hasEthiopicLetter(text);
  const en = hasLatin(text);
  if (ti && en) return "mixed";
  if (ti) return "ti";
  if (en) return "en";
  if (/[0-9\u1369-\u137C]/.test(text)) return "num";
  return "other";
}

function letterScript(ch) {
  if (/[A-Za-z]/.test(ch)) return "en";
  const cp = ch.codePointAt(0);
  if (
    (cp >= 0x1200 && cp <= 0x135f) ||
    (cp >= 0x1380 && cp <= 0x139f) ||
    (cp >= 0x2d80 && cp <= 0x2ddf) ||
    (cp >= 0xab00 && cp <= 0xab2f)
  ) {
    return "ti";
  }
  return null;
}

function stem(text) {
  let s = String(text).replace(/^["“«'([]+/u, "");
  s = s.replace(/["'”»)\].።፣፤፥፦፧፡?!;:,…—–-]+$/u, "");
  s = s.replace(/['’ʻ]/g, "");
  if (hasLatin(s) && !hasEthiopicLetter(s)) s = s.toLowerCase();
  return s;
}

function isListMarker(text) {
  const s = String(text).replace(/^["“«'([]+/, "");
  return /^(\d{1,3}|[\u1369-\u137C]{1,3})[.)፦፡፥:、]$/.test(s);
}

function endsHard(tok) {
  const text = tok.text;
  if (isListMarker(text)) return false;
  if (/[።፧?!]["”'»)\]]*$/.test(text)) return true;
  if (/(?:\.\.\.|…)["”'»)\]]*$/.test(text)) return false;
  if (/\.["”'»)\]]*$/.test(text)) {
    const bare = text.replace(/["”'»)\]]+$/g, "").replace(/\.+$/g, "");
    if (/^\d+$/.test(bare)) return false;
    if (/^(mr|mrs|ms|dr|st|vs|etc)$/i.test(bare)) return false;
    return true;
  }
  return false;
}

function endsMedium(tok) {
  if (tok.softWordspace || isListMarker(tok.text)) return false;
  const text = tok.text;
  if (/(?:\.\.\.|…)["”'»)\]]*$/.test(text)) return true;
  return /[፣፤፥፦፡,;:،—–]["”'»)\]]*$/.test(text);
}

function endsPause(tok) {
  return endsHard(tok) || endsMedium(tok);
}

function isDangling(tok) {
  return DANGLING.has(stem(tok.text));
}

function isGlue(tok) {
  return GLUE.has(stem(tok.text));
}

function openingKind(words, index) {
  const tok = words[index];
  if (!tok) return null;
  const w = stem(tok.text);
  const next = words[index + 1] ? stem(words[index + 1].text) : "";
  if (STRONG_OPEN.has(w) || CLAUSE_PAIRS.some(([a, b]) => w === a && next === b)) return "strong";
  if (DEMO_OPEN.has(w)) return "demo";
  return null;
}

function isLongSplit(tok) {
  return LONG_SPLIT.has(stem(tok.text));
}

function normalize(raw) {
  return String(raw)
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, "")
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function decodeXml(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function tokenize(text) {
  const prepared = text.replace(/፡(?=\S)/g, "፡\uE000");
  const parts = prepared.split(/(\uE000|\s+)/);
  const tokens = [];
  for (const part of parts) {
    if (!part) continue;
    if (part === "\uE000") {
      const prev = tokens[tokens.length - 1];
      if (prev && /፡$/u.test(prev.text) && !/[።፣፤፥፦፧?!;:,…]/u.test(prev.text)) {
        prev.softWordspace = true;
      }
      continue;
    }
    if (/^\s+$/.test(part)) continue;
    tokens.push({ text: part.replace(/\uE000/g, ""), softWordspace: false });
  }
  return tokens;
}

function splitMixedToken(token) {
  if (!hasEthiopicLetter(token) || !hasLatin(token)) return [token];
  const parts = [];
  let buf = "";
  let script = null;
  for (const ch of token) {
    const s = letterScript(ch);
    if (s === null || s === script || script === null) {
      buf += ch;
      if (s) script = s;
      continue;
    }
    let handoff = "";
    while (buf && OPENERS.has(buf[buf.length - 1])) {
      handoff = buf[buf.length - 1] + handoff;
      buf = buf.slice(0, -1);
    }
    if (buf) parts.push(buf);
    buf = handoff + ch;
    script = s;
  }
  if (buf) parts.push(buf);
  return parts.filter(Boolean);
}

function expandTokens(tokens) {
  const out = [];
  for (const tok of tokens) {
    const parts = splitMixedToken(tok.text);
    for (const text of parts) {
      out.push({
        text,
        softWordspace: tok.softWordspace && text === tok.text,
      });
    }
  }
  return out;
}

function splitScriptRuns(tokens) {
  const runs = [];
  let cur = null;
  const push = () => {
    if (!cur) return;
    if (cur.script === "pending") cur.script = "ti";
    runs.push(cur);
    cur = null;
  };
  for (const tok of tokens) {
    const kind = spokenScript(tok.text);
    const script = kind === "en" ? "en" : kind === "ti" || kind === "mixed" ? "ti" : null;
    if (!cur) {
      cur = { script: script || "pending", words: [tok] };
      continue;
    }
    if (script === null || cur.script === "pending" || cur.script === script) {
      if (cur.script === "pending" && script) cur.script = script;
      cur.words.push(tok);
      continue;
    }
    push();
    cur = { script, words: [tok] };
  }
  push();
  return runs;
}

function boundaryAfter(words, index) {
  const word = words[index];
  const next = words[index + 1];
  if (!next) return "end";
  if (isListMarker(next.text)) return "list";
  if (endsHard(word)) return "hard";
  if (endsMedium(word)) return "punct";
  if (isDangling(word)) return null;
  const opening = openingKind(words, index + 1);
  if (opening) return opening;
  if (isLongSplit(next)) return "weak";
  return null;
}

function laterStrong(words, from, to) {
  for (let k = from; k <= to && k < words.length; k++) {
    if (k === words.length - 1) return true;
    const kind = boundaryAfter(words, k);
    if (kind === "hard" || kind === "punct" || kind === "list" || kind === "strong" || kind === "demo") {
      return true;
    }
  }
  return false;
}

/** Pull a length cut back so the next line is not a 1- or 2-word leftover. */
function balanceCut(words, start, cut) {
  let len = cut - start + 1;
  let rest = words.length - cut - 1;
  if (rest > 0 && rest < MIN_WORDS && len + rest <= MAX_WORDS) {
    return words.length - 1;
  }
  while (rest > 0 && rest < MIN_WORDS && len > MIN_WORDS) {
    cut -= 1;
    len -= 1;
    rest += 1;
    while (cut > start && isDangling(words[cut])) {
      cut -= 1;
      len -= 1;
      rest += 1;
    }
  }
  if (words[cut] && isDangling(words[cut]) && cut - 1 >= start) cut -= 1;
  return cut;
}

function shouldAbsorbTail(words, index, len) {
  const rest = words.length - index - 1;
  if (rest !== 1 || len + rest > MAX_WORDS) return false;
  const tail = words[index + 1];
  if (!tail || isListMarker(tail.text)) return false;
  if (isGlue(tail) && !endsPause(tail)) return false;
  return true;
}

function packWords(words) {
  const lines = [];
  let i = 0;
  while (i < words.length) {
    const lastAllowed = Math.min(words.length - 1, i + MAX_WORDS - 1);
    let cut = -1;
    let natural = false;
    for (let j = i; j <= lastAllowed; j++) {
      const len = j - i + 1;
      const kind = j === words.length - 1 ? "end" : boundaryAfter(words, j);
      if (kind === "end" || kind === "hard" || kind === "list") {
        cut = j;
        natural = true;
        break;
      }
      const openReady =
        (kind === "strong" && len >= CLAUSE_MIN) || (kind === "demo" && len >= MIN_WORDS);
      if ((kind === "punct" || openReady) && shouldAbsorbTail(words, j, len)) {
        continue;
      }
      if (kind === "punct" || openReady) {
        cut = j;
        natural = true;
        break;
      }
      if (kind === "weak" && len >= WEAK_MIN && !laterStrong(words, j + 1, lastAllowed)) {
        cut = j;
        natural = true;
        break;
      }
    }
    if (cut < i) {
      let forced = -1;
      for (let j = lastAllowed; j >= i + MIN_WORDS - 1 && j > i; j--) {
        if (j >= words.length - 1) continue;
        if (isDangling(words[j])) continue;
        if (boundaryAfter(words, j)) {
          forced = j;
          break;
        }
      }
      cut = forced >= i ? forced : lastAllowed;
      if (words[cut] && isDangling(words[cut]) && cut - 1 >= i) cut -= 1;
      natural = false;
    }
    if (!natural) cut = balanceCut(words, i, cut);
    if (cut < i) cut = i;
    lines.push(words.slice(i, cut + 1));
    const next = cut + 1;
    if (next <= i) break;
    i = next;
  }
  return lines;
}

function lineFrom(words, script) {
  const last = words[words.length - 1];
  return {
    words: words.slice(),
    script,
    sentenceEnd: endsHard(last),
    list: isListMarker(words[0].text),
  };
}

function peelTrailingGlue(lines) {
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    if (line.words.length < 2 || next.list) continue;
    const last = line.words[line.words.length - 1];
    if (endsPause(last) || (!isDangling(last) && !isGlue(last))) continue;
    if (next.script === line.script) continue;
    if (next.words.length + 1 > MAX_WORDS) continue;
    line.words.pop();
    next.words.unshift(last);
    if (hasEthiopicLetter(last.text) && next.script !== "ti") next.script = "mixed";
    const end = line.words[line.words.length - 1];
    line.sentenceEnd = Boolean(end && endsHard(end));
  }
  return lines.filter((line) => line.words.length);
}

function attachGlueLines(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    const loneGlue =
      line.words.length === 1 && isGlue(line.words[0]) && !endsPause(line.words[0]);
    if (loneGlue && next && !next.list && next.words.length + 1 <= MAX_WORDS) {
      next.words.unshift(line.words[0]);
      if (next.script !== line.script) next.script = "mixed";
      continue;
    }
    if (loneGlue && !next) {
      const prev = out[out.length - 1];
      if (prev && !prev.sentenceEnd && prev.words.length + 1 <= MAX_WORDS) {
        prev.words.push(line.words[0]);
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

function canMerge(prev, line) {
  if (prev.script !== "ti" || line.script !== "ti") return false;
  if (prev.sentenceEnd || endsPause(prev.words[prev.words.length - 1])) return false;
  if (line.list) return false;
  const opening = openingKind(line.words, 0);
  if (opening === "strong" && prev.words.length >= CLAUSE_MIN) return false;
  if (opening === "demo" && prev.words.length >= MIN_WORDS) return false;
  if (prev.words.length >= MIN_WORDS && line.words.length >= MIN_WORDS) return false;
  return prev.words.length + line.words.length <= MAX_WORDS;
}

function rescueFragments(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    const word = line.words[0];
    if (
      line.words.length === 1 &&
      line.script === "ti" &&
      !line.list &&
      word &&
      !endsHard(word) &&
      next &&
      next.script === "ti" &&
      !next.list &&
      next.words.length + 1 <= MAX_WORDS
    ) {
      next.words.unshift(word);
      continue;
    }
    out.push(line);
  }
  return out;
}

function rebalance(lines) {
  const out = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev && canMerge(prev, line)) {
      prev.words = prev.words.concat(line.words);
      prev.sentenceEnd = line.sentenceEnd;
      continue;
    }
    out.push({
      words: line.words.slice(),
      script: line.script,
      sentenceEnd: line.sentenceEnd,
      list: line.list,
    });
  }
  return out;
}

function phraseParagraph(text) {
  const flat = String(text).replace(/\n+/g, " ").replace(/[ \t]{2,}/g, " ").trim();
  if (!flat) return [];
  const tokens = expandTokens(tokenize(flat));
  const packed = [];
  for (const run of splitScriptRuns(tokens)) {
    for (const group of packWords(run.words)) {
      packed.push(lineFrom(group, run.script));
    }
  }
  return rescueFragments(rebalance(attachGlueLines(peelTrailingGlue(packed)))).map((line) =>
    line.words.map((w) => w.text).join(" "),
  );
}

function sourceTokenTexts(paragraphs) {
  const texts = [];
  for (const p of paragraphs) {
    if (!String(p).trim()) continue;
    const flat = String(p).replace(/\n+/g, " ");
    for (const tok of expandTokens(tokenize(flat))) texts.push(tok.text);
  }
  return texts;
}

function outputTokenTexts(output) {
  return String(output)
    .split("\n")
    .flatMap((line) => (line.trim() ? line.trim().split(/\s+/) : []));
}

function assertFaithful(paragraphs, output) {
  const source = sourceTokenTexts(paragraphs);
  const got = outputTokenTexts(output);
  if (source.length !== got.length || source.some((word, i) => word !== got[i])) {
    const stop = source.findIndex((word, i) => word !== got[i]);
    throw new Error(
      "Phrase split changed the wording near “" +
        (source[stop] || got[stop] || "") +
        "”. Nothing was written.",
    );
  }
}

function phraseDocument(paragraphs) {
  const out = [];
  let blank = false;
  for (const p of paragraphs) {
    if (!String(p).trim()) {
      if (out.length) blank = true;
      continue;
    }
    if (blank) {
      if (out[out.length - 1] !== "") out.push("");
      blank = false;
    }
    out.push(...phraseParagraph(p));
  }
  while (out[0] === "") out.shift();
  while (out.length && out[out.length - 1] === "") out.pop();
  const collapsed = [];
  for (const line of out) {
    if (line === "" && collapsed[collapsed.length - 1] === "") continue;
    collapsed.push(line);
  }
  const text = collapsed.join("\n");
  assertFaithful(paragraphs, text);
  for (const line of collapsed) {
    if (!line) continue;
    const count = line.split(/\s+/).length;
    if (count > MAX_WORDS) {
      throw new Error("Line is longer than " + MAX_WORDS + " words: " + line);
    }
  }
  return text ? text + "\n" : "";
}

function textToParagraphs(raw) {
  const lines = normalize(raw).split("\n");
  const paragraphs = [];
  let buf = [];
  let blanks = 0;
  const flush = () => {
    if (!buf.length) return;
    paragraphs.push(buf.join(" ").replace(/[ \t]{2,}/g, " ").trim());
    buf = [];
  };
  for (const line of lines) {
    if (line.trim() === "") {
      flush();
      blanks += 1;
      if (blanks === 1 && paragraphs.length && paragraphs[paragraphs.length - 1] !== "") {
        paragraphs.push("");
      }
      continue;
    }
    blanks = 0;
    buf.push(line.trim());
  }
  flush();
  while (paragraphs[0] === "") paragraphs.shift();
  while (paragraphs.length && paragraphs[paragraphs.length - 1] === "") paragraphs.pop();
  return paragraphs;
}

function phraseText(raw) {
  return phraseDocument(textToParagraphs(raw));
}

function unzipEntry(buf, wanted) {
  if (buf.length < 4 || buf.readUInt32LE(0) !== 0x04034b50) {
    throw new Error("Not a docx file.");
  }
  let offset = 0;
  while (offset + 30 <= buf.length) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const flags = buf.readUInt16LE(offset + 6);
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.slice(offset + 30, offset + 30 + nameLen).toString("utf8").replace(/\\/g, "/");
    const dataStart = offset + 30 + nameLen + extraLen;
    if (flags & 0x8 && compSize === 0) {
      throw new Error("This docx omits compressed sizes. Open it in Word, save it, and run this again.");
    }
    if (name === wanted) {
      const data = buf.slice(dataStart, dataStart + compSize);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      throw new Error("Unsupported compression in " + name + ".");
    }
    offset = dataStart + compSize;
  }
  throw new Error("Could not find " + wanted + " in the docx.");
}

function paragraphText(pXml) {
  let chunk = pXml.replace(/<w:del\b[\s\S]*?<\/w:del>/g, "");
  let text = "";
  const re = /<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<w:cr\b[^>]*\/>|<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
  let m;
  while ((m = re.exec(chunk))) {
    if (m[1] !== undefined) text += decodeXml(m[1]);
    else text += " ";
  }
  return text.replace(/[ \t]{2,}/g, " ").trim();
}

function docxParagraphs(buf) {
  let xml = unzipEntry(buf, "word/document.xml").toString("utf8");
  xml = xml.replace(/<mc:Fallback\b[\s\S]*?<\/mc:Fallback>/g, "");
  xml = xml.replace(/<w:del\b[\s\S]*?<\/w:del>/g, "");
  const paragraphs = [];
  const re = /<w:p\b[^>]*\/>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  let m;
  while ((m = re.exec(xml))) paragraphs.push(paragraphText(m[0]));
  if (!paragraphs.length) throw new Error("The docx has no paragraphs.");
  return paragraphs;
}

function phraseDocx(buf) {
  return phraseDocument(docxParagraphs(buf));
}

function xmlEscape(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphXml(line) {
  if (!line) return "<w:p/>";
  return (
    "<w:p><w:pPr><w:spacing w:before=\"0\" w:after=\"0\" w:line=\"240\" w:lineRule=\"auto\"/></w:pPr>" +
    "<w:r><w:rPr><w:rFonts w:ascii=\"Ebrima\" w:hAnsi=\"Ebrima\" w:cs=\"Ebrima\" w:eastAsia=\"Ebrima\"/>" +
    "<w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr>" +
    "<w:t xml:space=\"preserve\">" +
    xmlEscape(line) +
    "</w:t></w:r></w:p>"
  );
}

function phrasesToDocx(text) {
  const rows = String(text).replace(/\n$/, "").split("\n");
  const document =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    "<w:body>" +
    rows.map(paragraphXml).join("") +
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>' +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/>' +
    "</w:sectPr></w:body></w:document>";
  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    "</Types>";
  const rels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    "</Relationships>";
  return zipFiles([
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(rels, "utf8") },
    { name: "word/document.xml", data: Buffer.from(document, "utf8") },
  ]);
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function zipFiles(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const data = zlib.deflateRawSync(file.data);
    const crc = crc32(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const localBuf = Buffer.concat([local, name, data]);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    locals.push(localBuf);
    offset += localBuf.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDir, end]);
}

function readScript(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".docx") return phraseDocx(fs.readFileSync(file));
  if (ext === ".txt" || ext === ".md") return phraseText(fs.readFileSync(file, "utf8"));
  throw new Error("Use a .docx or .txt script. Got " + (ext || "a file without an extension") + ".");
}

function summarize(text) {
  const rows = text.replace(/\n$/, "").split("\n");
  const short = [];
  const long = [];
  let blanks = 0;
  let phrases = 0;
  for (const row of rows) {
    if (!row.trim()) {
      blanks += 1;
      continue;
    }
    phrases += 1;
    const words = row.trim().split(/\s+/);
    const english = hasLatin(row) && !hasEthiopicLetter(row);
    const paused = endsPause({ text: words[words.length - 1], softWordspace: false });
    if (words.length > MAX_WORDS) long.push(row);
    else if (!english && words.length === 1) short.push(row);
    else if (words.length < MIN_WORDS && !english && !paused && !isListMarker(words[0])) short.push(row);
  }
  return { phrases, blanks, short, long };
}

function printHelp() {
  console.log(`Usage: node scripts/phrase-script.js <script.docx|script.txt> [output.txt] [--stdout]

Reads a crowded Tigrinya script and writes one spoken phrase per line
for timestamping. Each line is 3 to 5 words, shorter only when the beat
itself is shorter. Original spelling and wording stay as they are in the file.

A blank line in the output is written only where the source has an empty
paragraph (a long pause). Default output is <name>.phrases.txt and
<name>.phrases.docx. Each phrase is its own Word paragraph.

If a previous Word file is still open, the new copy is saved beside it
as <name>.phrases-2.docx.`);
}

function isFileLocked(error) {
  return error && (error.code === "EBUSY" || error.code === "EPERM" || error.code === "EACCES");
}

function writeOutput(file, data, encoding) {
  const ext = path.extname(file);
  const stem = ext ? file.slice(0, -ext.length) : file;
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? file : stem + "-" + n + ext;
    try {
      if (encoding) fs.writeFileSync(candidate, data, encoding);
      else fs.writeFileSync(candidate, data);
      return { path: candidate, locked: n === 1 ? null : file };
    } catch (error) {
      if (!isFileLocked(error)) throw error;
    }
  }
  const busy = new Error(path.basename(file) + " is open. Close it, then run this again.");
  busy.code = "EBUSY";
  throw busy;
}

function main(argv) {
  const toStdout = argv.includes("--stdout");
  const args = argv.filter((a) => a !== "--stdout");
  if (!args.length || args.includes("-h") || args.includes("--help")) {
    printHelp();
    return args.length ? 0 : 1;
  }
  const input = path.resolve(args[0]);
  if (!fs.existsSync(input)) {
    console.error("File not found: " + input);
    return 1;
  }
  const outputs = outputPaths(input, args[1]);
  if (outputs.txt === input || outputs.docx === input) {
    console.error("Pick an output path that is not the source file.");
    return 1;
  }
  let text;
  try {
    text = readScript(input);
  } catch (error) {
    console.error(error.message || String(error));
    return 1;
  }
  let txt;
  let docx;
  try {
    txt = writeOutput(outputs.txt, text, "utf8");
    docx = writeOutput(outputs.docx, phrasesToDocx(text));
  } catch (error) {
    console.error(error.message || String(error));
    return 1;
  }
  if (toStdout) process.stdout.write(text);
  const stats = summarize(text);
  const log = toStdout ? console.error : console.log;
  log("Wrote " + txt.path);
  if (txt.locked) log(path.basename(txt.locked) + " is open, so this copy was saved beside it.");
  log("Wrote " + docx.path);
  if (docx.locked) log(path.basename(docx.locked) + " is open, so this copy was saved beside it.");
  log("phrases: " + stats.phrases + (stats.blanks ? ", pause lines: " + stats.blanks : ""));
  if (stats.short.length) {
    log("review these short lines:");
    for (const line of stats.short.slice(0, 8)) log("  " + line);
  }
  if (stats.long.length) {
    log("review these long lines:");
    for (const line of stats.long.slice(0, 8)) log("  " + line);
  }
  return 0;
}

function outputPaths(input, requested) {
  const source = path.resolve(input);
  if (!requested) {
    const dir = path.dirname(source);
    const base = path.basename(source, path.extname(source));
    return {
      txt: path.join(dir, base + ".phrases.txt"),
      docx: path.join(dir, base + ".phrases.docx"),
    };
  }
  const resolved = path.resolve(requested);
  const ext = path.extname(resolved).toLowerCase();
  const stem = ext ? resolved.slice(0, -ext.length) : resolved;
  if (ext === ".docx") return { txt: stem + ".txt", docx: resolved };
  return { txt: ext === ".txt" ? resolved : stem + ".txt", docx: stem + ".docx" };
}

module.exports = {
  phraseText,
  phraseDocument,
  phraseDocx,
  phrasesToDocx,
  docxParagraphs,
  readScript,
  summarize,
  textToParagraphs,
  outputPaths,
  writeOutput,
};

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
