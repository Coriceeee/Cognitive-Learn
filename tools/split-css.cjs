const fs = require("fs");
const path = require("path");

const root = process.cwd();
const sourcePath = path.join(root, "src", "styles.css");
const backupPath = path.join(root, "src", "styles.full.backup.css");
const outputDir = path.join(root, "src", "styles");

const outputFiles = {
  base: "00-base.css",
  auth: "01-auth.css",
  role: "02-role.css",
  seed: "03-seed.css",
  nexus: "04-nexus.css",
  common: "05-common.css",
  info: "06-info.css",
  responsive: "99-responsive.css",
};

if (!fs.existsSync(sourcePath)) {
  throw new Error("Không tìm thấy src/styles.css");
}

const originalCss = fs.readFileSync(sourcePath, "utf8");

if (originalCss.includes('@import "./styles/00-base.css"')) {
  throw new Error(
    "src/styles.css hiện tại đã là file import tổng rồi. Hãy khôi phục CSS gốc trước khi chạy script."
  );
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(backupPath, originalCss, "utf8");

const buckets = {
  base: [],
  auth: [],
  role: [],
  seed: [],
  nexus: [],
  common: [],
  info: [],
  responsive: [],
};

function normalize(css) {
  return css.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function skipSpaces(css, index) {
  while (index < css.length && /\s/.test(css[index])) {
    index += 1;
  }

  return index;
}

function findMatchingBrace(css, openIndex) {
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let escaped = false;

  for (let i = openIndex; i < css.length; i += 1) {
    const char = css[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === stringChar) {
        inString = false;
        stringChar = "";
      }

      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function findNextRuleBoundary(css, index) {
  const braceIndex = css.indexOf("{", index);
  const semicolonIndex = css.indexOf(";", index);

  if (semicolonIndex !== -1 && (braceIndex === -1 || semicolonIndex < braceIndex)) {
    return {
      type: "semicolon",
      index: semicolonIndex,
    };
  }

  if (braceIndex !== -1) {
    return {
      type: "brace",
      index: braceIndex,
    };
  }

  return {
    type: "end",
    index: css.length,
  };
}

function parseCss(css) {
  const normalizedCss = normalize(css);
  const rules = [];
  let index = 0;

  while (index < normalizedCss.length) {
    index = skipSpaces(normalizedCss, index);

    if (index >= normalizedCss.length) break;

    if (normalizedCss.startsWith("/*", index)) {
      const commentEnd = normalizedCss.indexOf("*/", index + 2);
      if (commentEnd === -1) break;

      const comment = normalizedCss.slice(index, commentEnd + 2);
      rules.push({
        type: "comment",
        header: "",
        content: comment,
      });

      index = commentEnd + 2;
      continue;
    }

    const boundary = findNextRuleBoundary(normalizedCss, index);

    if (boundary.type === "end") {
      const tail = normalizedCss.slice(index).trim();
      if (tail) {
        rules.push({
          type: "raw",
          header: "",
          content: tail,
        });
      }

      break;
    }

    if (boundary.type === "semicolon") {
      const content = normalizedCss.slice(index, boundary.index + 1).trim();

      if (content) {
        rules.push({
          type: content.startsWith("@import") ? "import" : "atrule",
          header: content,
          content,
        });
      }

      index = boundary.index + 1;
      continue;
    }

    const openBrace = boundary.index;
    const closeBrace = findMatchingBrace(normalizedCss, openBrace);

    if (closeBrace === -1) {
      const broken = normalizedCss.slice(index).trim();

      if (broken) {
        rules.push({
          type: "raw",
          header: "",
          content: broken,
        });
      }

      break;
    }

    const header = normalizedCss.slice(index, openBrace).trim();
    const content = normalizedCss.slice(index, closeBrace + 1).trim();

    let type = "rule";

    if (header.startsWith("@media")) type = "media";
    else if (header.startsWith("@keyframes") || header.startsWith("@-webkit-keyframes")) {
      type = "keyframes";
    } else if (header.startsWith("@")) {
      type = "atrule-block";
    }

    rules.push({
      type,
      header,
      content,
    });

    index = closeBrace + 1;
  }

  return rules;
}

function hasAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function isBaseSelector(selector) {
  const cleaned = selector.trim();

  const exactBase = [
    ":root",
    "*",
    "html",
    "body",
    "button",
    "input",
    "select",
    "textarea",
    "a",
    "img",
    "button:hover:not(:disabled)",
    "button:disabled",
  ];

  const parts = cleaned
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length === 0) return false;

  return parts.every((part) => exactBase.includes(part));
}

function classifyRule(rule) {
  const header = rule.header || "";
  const content = rule.content || "";
  const target = `${header}\n${content}`;

  if (rule.type === "import") return "base";
  if (rule.type === "media") return "responsive";

  if (rule.type === "keyframes") {
    if (header.includes("pupil-peek")) return "auth";
    if (header.includes("claIconFloat") || header.includes("claPulse")) return "common";
    return "base";
  }

  if (rule.type === "comment") return "base";

  if (isBaseSelector(header)) return "base";

  if (
    hasAny(target, [
      ".login-page",
      ".profile-showcase",
      ".showcase-",
      ".auth-",
      ".login-card",
      ".login-form",
      ".password-field",
      ".peek-",
      ".google-button",
      ".auth-switch",
      ".login-message",
      ".role-tabs",
      ".dot",
      ".d1",
      ".d2",
      ".d3",
      ".d4",
      ".d5",
      ".future-map",
      ".dashboard-preview",
      ".learning-stack",
      ".profile-card-inner",
      ".scan-board",
      ".map-center",
      ".preview-main-card",
      ".preview-orbit-card",
      ".wow-left",
      ".product-preview-left",
      ".cognitive-scan-left",
    ])
  ) {
    return "auth";
  }

  if (
    hasAny(target, [
      ".role-page",
      ".role-floating",
      ".role-home-logo",
      ".back-admin-button",
      ".floating-logout-button",
      ".role-shell",
      ".role-topbar",
      ".role-landing",
      ".role-preview",
      ".role-profile",
      ".role-avatar",
      ".role-card-grid",
      ".admin-switcher",
      ".admin-actions",
    ])
  ) {
    return "role";
  }

  if (
    hasAny(target, [
      ".student-",
      ".student-page",
      ".profile-page",
      ".profile-floating",
      ".profile-home-logo",
      ".profile-back-admin",
      ".profile-logout-button",
      ".profile-shell",
      ".profile-head",
      ".profile-form",
      ".profile-section",
      ".profile-field",
      ".profile-score",
      ".profile-gpa",
      ".profile-submit",
      ".profile-actions",
      ".profile-message",
      ".profile-table",
      ".profile-transcript",
      ".profile-elective",
      ".profile-data",
    ])
  ) {
    return "seed";
  }

  if (hasAny(target, [".nexus-"])) {
    return "nexus";
  }

  if (
    hasAny(target, [
      ".user-",
      ".admin-top-link",
      ".admin-return-link",
      ".module-cluster",
    ])
  ) {
    return "common";
  }

  if (
    hasAny(target, [
      ".info-",
      ".premium-info",
      ".about-",
      ".contact-",
    ])
  ) {
    return "info";
  }

  return "common";
}

const rules = parseCss(originalCss);

for (const rule of rules) {
  const bucket = classifyRule(rule);
  buckets[bucket].push(rule.content);
}

function writeBucket(name, title) {
  const filePath = path.join(outputDir, outputFiles[name]);
  const content = [
    `/* ${title} */`,
    "",
    ...buckets[name],
    "",
  ].join("\n\n");

  fs.writeFileSync(filePath, content.trim() + "\n", "utf8");
}

writeBucket("base", "Base / variables / global reset");
writeBucket("auth", "Auth / Login page");
writeBucket("role", "Role page");
writeBucket("seed", "Seed module / Student pages");
writeBucket("nexus", "Nexus admin console");
writeBucket("common", "Common components / UserMenu / ModuleClusterGrid");
writeBucket("info", "About / Contact pages");
writeBucket("responsive", "Responsive media queries");

const importCss = `@import "./styles/00-base.css";
@import "./styles/01-auth.css";
@import "./styles/02-role.css";
@import "./styles/03-seed.css";
@import "./styles/04-nexus.css";
@import "./styles/05-common.css";
@import "./styles/06-info.css";
@import "./styles/99-responsive.css";
`;

fs.writeFileSync(sourcePath, importCss, "utf8");

console.log("Đã tách CSS xong:");
console.log("Backup:", path.relative(root, backupPath));
console.log("Output:", path.relative(root, outputDir));

for (const [key, filename] of Object.entries(outputFiles)) {
  const fullPath = path.join(outputDir, filename);
  const count = buckets[key].length;
  console.log(`- ${filename}: ${count} block`);
}