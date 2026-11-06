const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const zlib = require("node:zlib");
const { phraseText, phraseDocx, docxParagraphs, phrasesToDocx, writeOutput } = require("./phrase-script");

function lines(text) {
  const trimmed = String(text).replace(/\n$/, "");
  return trimmed === "" ? [] : trimmed.split("\n");
}

function wordsOf(text) {
  return lines(text).flatMap((line) => (line.trim() ? line.trim().split(/\s+/) : []));
}

test("splits the sample into one breath per line and keeps the words", () => {
  const source = "ሰላም ንዓኻትኩም ይኹን ነቶም ዝደኸሙን ዝጠመዩን እቲ ናይ እግዚኣብሔር ስቕታ";
  assert.deepEqual(lines(phraseText(source)), [
    "ሰላም ንዓኻትኩም ይኹን",
    "ነቶም ዝደኸሙን ዝጠመዩን",
    "እቲ ናይ እግዚኣብሔር ስቕታ",
  ]);
});

test("keeps punctuation and splits at commas, periods, and clause openings", () => {
  const source =
    "ሰላም ንዓኻትኩም ይኹን። ነቶም ዝደኸሙን ዝጠመዩን እቲ ናይ እግዚኣብሔር ስቕታ ብጣዕሚ ዓቢ ትርጉም ኣለዎ፣ ምኽንያቱ ንሕና ኣብ ጸገም ከለና ንሱ ምሳና እዩ።";
  assert.deepEqual(lines(phraseText(source)), [
    "ሰላም ንዓኻትኩም ይኹን።",
    "ነቶም ዝደኸሙን ዝጠመዩን",
    "እቲ ናይ እግዚኣብሔር ስቕታ ብጣዕሚ",
    "ዓቢ ትርጉም ኣለዎ፣",
    "ምኽንያቱ ንሕና ኣብ ጸገም ከለና",
    "ንሱ ምሳና እዩ።",
  ]);
});

test("does not rewrite Ge’ez spelling", () => {
  const spelling = "እግዚአብሔር";
  const out = phraseText("እቲ ናይ " + spelling + " ስቕታ");
  assert.equal(lines(out).join(" "), "እቲ ናይ " + spelling + " ስቕታ");
});

test("puts an English beat on its own line", () => {
  const source = "ንቻነልና ሓደሽቲ አንተኾንኩም ድማ subscribe ኣበይ ዓድን ከተማን ኮንኩን።";
  assert.deepEqual(lines(phraseText(source)), [
    "ንቻነልና ሓደሽቲ አንተኾንኩም ድማ",
    "subscribe",
    "ኣበይ ዓድን ከተማን ኮንኩን።",
  ]);
});

test("keeps a parenthetical English name intact on its own line", () => {
  const source = "መጽናዕቲ ከም ዘረጋገጾ ናይ ኣእምሮ ፅሞና (Mindfulness) ነዚ ጨካን ውሽጣዊ ፍርዲ የብርህ።";
  assert.deepEqual(lines(phraseText(source)), [
    "መጽናዕቲ ከም ዘረጋገጾ",
    "ናይ ኣእምሮ ፅሞና",
    "(Mindfulness)",
    "ነዚ ጨካን ውሽጣዊ ፍርዲ የብርህ።",
  ]);
});

test("keeps a quoted English title together and does not invent words", () => {
  const source = 'እዚ ዝበሃል "Grand Slam Offer" እዩ።';
  const out = phraseText(source);
  assert.deepEqual(lines(out), ['እዚ ዝበሃል', '"Grand Slam Offer"', "እዩ።"]);
  assert.deepEqual(wordsOf(out), source.split(/\s+/));
});

test("joins a lone conjunction to the following English beat", () => {
  const source = "ፍርያትካ ሕማቕ ስለዝኾነ ወይ marketing ስለዝጎደለካ ኣይኮነን።";
  assert.deepEqual(lines(phraseText(source)), [
    "ፍርያትካ ሕማቕ ስለዝኾነ",
    "ወይ marketing",
    "ስለዝጎደለካ ኣይኮነን።",
  ]);
});

test("uses one blank line only for an empty paragraph", () => {
  const source = "ሰላም ንዓኻትኩም ይኹን\n\n\n\nእቲ ናይ እግዚኣብሔር ስቕታ\n";
  assert.deepEqual(lines(phraseText(source)), [
    "ሰላም ንዓኻትኩም ይኹን",
    "",
    "እቲ ናይ እግዚኣብሔር ስቕታ",
  ]);
});

test("does not insert a blank line between ordinary paragraphs", () => {
  const source = "ሰላም ንዓኻትኩም ይኹን።\nእቲ ናይ እግዚኣብሔር ስቕታ።\n";
  assert.deepEqual(lines(phraseText(source)), [
    "ሰላም ንዓኻትኩም ይኹን።",
    "እቲ ናይ እግዚኣብሔር ስቕታ።",
  ]);
});

test("splits before ግን after a two-word opening", () => {
  const source = "እቲ ሓደ ግን ብዙሕ ሰብ ከይመጾ በይኑ ኾፍ ኢሉ ይውዕል።";
  assert.deepEqual(lines(phraseText(source)), [
    "እቲ ሓደ",
    "ግን ብዙሕ ሰብ ከይመጾ በይኑ",
    "ኾፍ ኢሉ ይውዕል።",
  ]);
});

test("joins a one-word comma fragment to the following Tigrinya line", () => {
  const source = "ብኣሌክስ ሆርሞዚ (Alex Hormozi) ዝተጻሕፈት፣ ብኸመይ ካብ ባዶ ተላዒሉ።";
  assert.deepEqual(lines(phraseText(source)), [
    "ብኣሌክስ ሆርሞዚ",
    "(Alex Hormozi)",
    "ዝተጻሕፈት፣ ብኸመይ ካብ ባዶ ተላዒሉ።",
  ]);
});

test("keeps a short noun phrase with its demonstrative", () => {
  assert.deepEqual(lines(phraseText("ኣብዛ ቪድዮ እዚኣ፡ ብኣሌክስ ሆርሞዚ።")), [
    "ኣብዛ ቪድዮ እዚኣ፡",
    "ብኣሌክስ ሆርሞዚ።",
  ]);
});

test("keeps a preposition with the English title it introduces", () => {
  const source = "እትሕብር ናይ '$100M Offers' ዘርእስታ መጽሓፍ።";
  assert.deepEqual(lines(phraseText(source)), [
    "እትሕብር",
    "ናይ '$100M Offers'",
    "ዘርእስታ መጽሓፍ።",
  ]);
});

test("splits a spaced Ethiopic comma and keeps a glued wordspace in the line", () => {
  assert.deepEqual(lines(phraseText("ሓደ ሰብ፡ ካልኣይ ሰብ።")), ["ሓደ ሰብ፡", "ካልኣይ ሰብ።"]);
  assert.deepEqual(lines(phraseText("ሰላም፡ንዓኻትኩም፡ይኹን።")), ["ሰላም፡ ንዓኻትኩም፡ ይኹን።"]);
});

test("keeps every word of a long line and stays within 5 words", () => {
  const source = [
    "ሓደ",
    "ክልተ",
    "ሰለስተ",
    "ኣርባዕተ",
    "ሓሙሽተ",
    "ሽድሽተ",
    "ሸውዓተ",
    "ሾመንተ",
    "ትሽዓተ",
    "ዓሰርተ",
    "ዓሰርተሓደ",
    "ዓሰርተክልተ",
    "ዓሰርተሰለስተ",
    "ዓሰርተኣርባዕተ",
  ].join(" ");
  const out = phraseText(source);
  assert.deepEqual(wordsOf(out), source.split(" "));
  for (const line of lines(out)) {
    assert.ok(line.split(/\s+/).length <= 5, line);
    assert.ok(line.split(/\s+/).length >= 3, line);
  }
});

test("reads a docx paragraph, including one empty paragraph as a pause", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>ሰላም ንዓኻትኩም ይኹን ነቶም ዝደኸሙን ዝጠመዩን እቲ ናይ እግዚኣብሔር ስቕታ</w:t></w:r></w:p>
    <w:p></w:p>
    <w:p><w:r><w:t xml:space="preserve">subscribe ኣብዚ</w:t></w:r></w:p>
  </w:body>
</w:document>`;
  const buf = zipStore([{ name: "word/document.xml", data: Buffer.from(xml, "utf8") }]);
  const paragraphs = docxParagraphs(buf);
  assert.deepEqual(paragraphs, [
    "ሰላም ንዓኻትኩም ይኹን ነቶም ዝደኸሙን ዝጠመዩን እቲ ናይ እግዚኣብሔር ስቕታ",
    "",
    "subscribe ኣብዚ",
  ]);
  assert.deepEqual(lines(phraseDocx(buf)), [
    "ሰላም ንዓኻትኩም ይኹን",
    "ነቶም ዝደኸሙን ዝጠመዩን",
    "እቲ ናይ እግዚኣብሔር ስቕታ",
    "",
    "subscribe",
    "ኣብዚ",
  ]);
});

test("docx output keeps one paragraph per phrase, including a pause", () => {
  const text = 'ሰላም ንዓኻትኩም ይኹን\n\nናይ "$100M Offers"\n';
  assert.deepEqual(docxParagraphs(phrasesToDocx(text)), [
    "ሰላም ንዓኻትኩም ይኹን",
    "",
    'ናይ "$100M Offers"',
  ]);
});

test("cli writes a utf8 phrase file and a docx", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "phrase-script-"));
  const input = path.join(dir, "script.txt");
  const output = path.join(dir, "out.txt");
  fs.writeFileSync(input, "ሰላም ንዓኻትኩም ይኹን ነቶም ዝደኸሙን ዝጠመዩን እቲ ናይ እግዚኣብሔር ስቕታ\n", "utf8");
  const { spawnSync } = require("node:child_process");
  const run = spawnSync(process.execPath, [path.join(__dirname, "phrase-script.js"), input, output], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /phrases: 3/);
  assert.equal(
    fs.readFileSync(output, "utf8"),
    "ሰላም ንዓኻትኩም ይኹን\nነቶም ዝደኸሙን ዝጠመዩን\nእቲ ናይ እግዚኣብሔር ስቕታ\n",
  );
  assert.match(run.stdout, /out\.docx/);
  assert.deepEqual(docxParagraphs(fs.readFileSync(path.join(dir, "out.docx"))), [
    "ሰላም ንዓኻትኩም ይኹን",
    "ነቶም ዝደኸሙን ዝጠመዩን",
    "እቲ ናይ እግዚኣብሔር ስቕታ",
  ]);
});

test("saves beside a locked phrase file instead of crashing", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "phrase-script-lock-"));
  const locked = path.join(dir, "cana.phrases.docx");
  fs.writeFileSync(locked, "old");
  const quoted = locked.replace(/'/g, "''");
  const holder = spawn(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `$fs = [System.IO.File]::Open('${quoted}', 'Open', 'ReadWrite', 'None'); [Console]::Out.WriteLine('locked'); [Console]::Out.Flush(); Start-Sleep -Seconds 20; $fs.Close()`,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("file was not locked")), 8000);
      holder.stdout.on("data", (chunk) => {
        if (String(chunk).includes("locked")) {
          clearTimeout(timer);
          resolve();
        }
      });
      holder.on("exit", (code) => {
        clearTimeout(timer);
        reject(new Error("lock holder exited " + code));
      });
    });
    const written = writeOutput(locked, Buffer.from("new phrases"));
    assert.equal(written.path, path.join(dir, "cana.phrases-2.docx"));
    assert.equal(written.locked, locked);
    assert.equal(fs.readFileSync(written.path, "utf8"), "new phrases");
  } finally {
    holder.kill();
  }
});

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function zipStore(files) {
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
