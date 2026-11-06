const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const plan = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/edit_plan.json"), "utf8"),
);
const srt = fs.readFileSync("c:/Users/hp/Downloads/natty1.srt", "utf8");

function parseTs(t) {
  const m = t.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  const ms = m[4].padEnd(3, "0").slice(0, 3);
  return +m[1] * 3600 + +m[2] * 60 + +m[3] + +ms / 1000;
}

const cues = srt
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n\r?\n/)
  .map((b, i) => {
    const lines = b.split(/\r?\n/).filter(Boolean);
    const t = lines.find((l) => l.includes("-->"));
    const [a, b2] = t.split("-->");
    return {
      i: i + 1,
      start: Math.round(parseTs(a) * 1000) / 1000,
      end: Math.round(parseTs(b2) * 1000) / 1000,
      text: lines
        .slice(lines.indexOf(t) + 1)
        .join(" ")
        .replace(/["']/g, "")
        .replace(/\*/g, "")
        .trim(),
    };
  });

const keys = [
  [/Starving Crowd|ጠለብ ምንዳይ|ሃንቀውታ ዝጽበየ/, "secret1"],
  [/Niche|ኒች|ዓውዲ ናብ ዓውዲ/, "niche"],
  [/Commodity|ኮሞዲቲ/, "commodity"],
  [/Category of One|ካቴጎሪ/, "category"],
  [/Premium|ልዑል ወይ ክቡር ዋጋ|ክቡር ዋጋ ምሕታት/, "premium"],
  [/Value Equation|ቀመር ዋጋ/, "valueEq"],
  [/Dream Outcome|ዝለዓለ ተስፋ/, "dream"],
  [/10x|10 ዕጽፊ|ፈተነ 10/, "tenX"],
  [/1\/10|ትሑት ወጻኢ|ፈተነ 1/, "tenth"],
  [/Scarcity|ዉሱንነት|ውሱንነት ምፍጣር/, "scarcity"],
  [/Urgency|ህጹጽነት ምፍጣር|ህጹጽነት/, "urgency"],
  [/Bonus|ቦነስ/, "bonus"],
  [/Risk Reversal|ስግኣት ናብ ዜሮ|ውሕስና|Guarantee/, "risk"],
  [/MAGIC|ቀመር ስም|M - A - G/, "magic"],
  [/Grand Slam|ዘይነጽግ ኣቕርቦት/, "grandSlam"],
  [/\$100M|100M Offers|ሆርሞዚ|Hormozi/, "hormozi"],
  [/ቀዳማይ ሚስጢር|መበል 1|ሚስጢር 1|ምስጢር 1/, "sec1word"],
  [/መበል 2|ሚስጢር 2|ምስጢር 2|ካልኣይ ሚስጢር/, "sec2word"],
  [/መበል 3|ሚስጢር 3|ምስጢር 3/, "sec3word"],
  [/መበል 4|ሚስጢር 4|ምስጢር 4/, "sec4word"],
  [/መበል 5|ሚስጢር 5|ምስጢር 5/, "sec5word"],
  [/መበል 6|ሚስጢር 6|ምስጢር 6/, "sec6word"],
  [/መበል 7|ሚስጢር 7|ምስጢር 7/, "sec7word"],
  [/መበል 8|ሚስጢር 8|ምስጢር 8/, "sec8word"],
  [/መበል 9|ሚስጢር 9|ምስጢር 9/, "sec9word"],
  [/መበል 10|ሚስጢር 10|ምስጢር 10/, "sec10word"],
  [/10 ሚስጢራት|10 ምስጢራት|ኣሰርተ ሚስጢር/, "tenSecrets"],
  [/Subscribe|ተኸታተሉ|ሰላም/, "cta"],
];

console.log("=== KEYWORD HITS ===");
for (const [re, name] of keys) {
  const hits = cues.filter((c) => re.test(c.text));
  console.log(
    name + ":",
    hits
      .slice(0, 8)
      .map((h) => "#" + h.i + "@" + h.start + " " + h.text.slice(0, 60))
      .join(" || ") || "NONE",
  );
}

console.log("\n=== CURRENT SCENES ===");
const scenes = plan.clips.filter((c) => !String(c.id).includes("viz"));
for (const c of scenes) {
  const img = c.layers.find((l) => l.type === "image");
  const ov = c.layers.find((l) => l.type !== "image" && l.type !== "text");
  const inside = cues.filter(
    (q) => q.start >= c.start_sec - 0.001 && q.start < c.end_sec - 0.001,
  );
  const first = inside[0];
  const last = inside[inside.length - 1];
  console.log(
    [
      c.id,
      c.start_sec + "-" + c.end_sec,
      img && img.asset_id,
      ov &&
        ov.type +
          ":" +
          String(ov.title || ov.text || ov.label || "").slice(0, 40),
      "cues=" + inside.length,
      first && "#" + first.i + " " + first.text.slice(0, 50),
      last && "…#" + last.i + " " + last.text.slice(0, 40),
    ].join(" | "),
  );
}

// Print all cues that mention numbered secrets for remapping
console.log("\n=== ALL CUES WITH ሚስጢር/ምስጢር ===");
for (const c of cues) {
  if (/ሚስጢር|ምስጢር|Secret|secret/.test(c.text)) {
    console.log("#" + c.i + " @" + c.start + "-" + c.end + " " + c.text);
  }
}
