// Generates the placeholder produce illustrations used by the seed catalog.
// These are SVG illustrations, NOT photographs — replace with real product photography before launch.
// Usage: npm run art
import { mkdirSync, writeFileSync } from "node:fs";

let gid = 0;
const defs = [];
function grad(c1, c2, c3) {
  const id = `g${gid++}`;
  defs.push(
    `<radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient>`,
  );
  return `url(#${id})`;
}
function lin(c1, c2, x2 = 0, y2 = 1) {
  const id = `g${gid++}`;
  defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
  return `url(#${id})`;
}
const leaf = (x, y, s, rot = -30, c = "#3FA34D") =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C 18 -22 52 -18 64 0 C 52 18 18 22 0 0Z" fill="${c}"/><path d="M2 0 H58" stroke="#2C7A38" stroke-width="2.5" stroke-linecap="round"/></g>`;
const shine = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".35"/>`;

const items = {
  apple: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 -38 C -30 -60 -72 -36 -66 6 C -60 50 -26 70 0 58 C 26 70 60 50 66 6 C 72 -36 30 -60 0 -38Z" fill="${grad("#ff8a80", "#e53935", "#8e1b1b")}"/>
    <path d="M0 -38 C 2 -52 6 -62 12 -70" stroke="#5d3a1a" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${leaf(8, -60, 0.55, -35)}${shine(-30, -14, 12, 20)}</g>`,
  tomato: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="66" ry="56" fill="${grad("#ff7b6b", "#e8392c", "#9d1c12")}"/>
    <path d="M0 -50 l10 -14 l4 16 l18 -6 l-10 14 l18 6 l-20 4 l4 16 l-14 -12 l-14 12 l4 -16 l-20 -4 l18 -6 l-10 -14 l18 6Z" fill="#2E8B3A"/>
    <path d="M0 -60 v-12" stroke="#2E7D32" stroke-width="5" stroke-linecap="round"/>${shine(-28, -18, 14, 18)}</g>`,
  orange: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <circle r="62" fill="${grad("#ffcc80", "#fb8c00", "#c25e00")}"/>
    <circle cx="-14" cy="12" r="1.6" fill="#d97706" opacity=".6"/><circle cx="18" cy="-8" r="1.6" fill="#d97706" opacity=".6"/><circle cx="24" cy="26" r="1.6" fill="#d97706" opacity=".6"/>
    <circle cx="0" cy="-58" r="5" fill="#5d7a2a"/>${leaf(2, -58, 0.6, -20)}${shine(-24, -22, 14, 18)}</g>`,
  lemon: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-70 0 C -60 -46 60 -46 70 0 C 60 46 -60 46 -70 0Z" fill="${grad("#fff59d", "#c6d82f", "#6f9a1a")}"/>${shine(-24, -14, 18, 10)}</g>`,
  onion: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 -70 C 6 -50 70 -30 62 14 C 56 52 -56 52 -62 14 C -70 -30 -6 -50 0 -70Z" fill="${grad("#e7a6c2", "#b04a7a", "#6d1f45")}"/>
    <path d="M0 -66 C -20 -20 -24 30 -10 48 M0 -66 C 20 -20 24 30 10 48" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none"/>
    <path d="M-6 48 q6 10 12 0" stroke="#c9a27a" stroke-width="3" fill="none"/>${shine(-26, -4, 10, 18)}</g>`,
  potato: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-72 4 C -76 -34 -30 -50 10 -46 C 56 -42 80 -20 74 10 C 68 44 20 52 -14 48 C -52 44 -70 30 -72 4Z" fill="${grad("#f1d49a", "#c9974f", "#8a5a25")}"/>
    <circle cx="-30" cy="-10" r="3" fill="#8a5a25" opacity=".6"/><circle cx="16" cy="12" r="3" fill="#8a5a25" opacity=".6"/><circle cx="38" cy="-16" r="2.5" fill="#8a5a25" opacity=".6"/><circle cx="-8" cy="26" r="2.5" fill="#8a5a25" opacity=".6"/>${shine(-30, -24, 16, 8)}</g>`,
  banana: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-80 -30 C -60 40 40 60 84 -10 C 70 6 20 30 -20 14 C -50 2 -66 -16 -72 -36Z" fill="${lin("#fff176", "#f9a825")}"/>
    <path d="M-80 -30 l-8 -8 l8 -4 l6 6Z" fill="#6d4c1f"/><path d="M84 -10 l6 -2 l-2 6Z" fill="#6d4c1f"/>
    <path d="M-60 -10 C -30 26 30 34 70 0" stroke="#e0a800" stroke-width="3" fill="none" opacity=".6"/></g>`,
  carrot: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-20 -60 C 10 -66 26 -54 22 -40 L -48 74 C -52 80 -58 78 -56 70Z" fill="${lin("#ffb74d", "#ef6c00", 1, 0)}"/>
    <path d="M-30 -20 h12 M-38 10 h10 M-46 40 h8" stroke="#c75b00" stroke-width="3" stroke-linecap="round"/>
    <path d="M4 -58 C 0 -90 -10 -100 -18 -104 M8 -58 C 14 -92 24 -100 34 -104 M2 -58 C 6 -96 6 -108 4 -116" stroke="#3FA34D" stroke-width="7" fill="none" stroke-linecap="round"/></g>`,
  broccoli: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-14 10 L -20 70 Q 0 78 20 70 L 14 10Z" fill="${lin("#a5d6a7", "#66bb6a")}"/>
    ${[[-40, -10, 30], [0, -30, 36], [40, -10, 30], [-22, 14, 26], [22, 14, 26], [-50, -40, 22], [46, -42, 22], [0, -64, 24]]
      .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${grad("#7cc576", "#2e7d32", "#1b5e20")}"/>`)
      .join("")}</g>`,
  spinach: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    ${[-50, -20, 10, 40].map((r, i) => `<g transform="rotate(${r})"><path d="M0 60 C -40 10 -30 -60 0 -80 C 30 -60 40 10 0 60Z" fill="${["#2e7d32", "#388e3c", "#43a047", "#2e7d32"][i]}"/><path d="M0 60 V -70" stroke="#a5d6a7" stroke-width="3"/></g>`).join("")}</g>`,
  cucumber: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(-20)">
    <rect x="-90" y="-26" width="180" height="52" rx="26" fill="${lin("#66bb6a", "#1b5e20")}"/>
    <path d="M-70 -8 H70 M-60 8 H60" stroke="#a5d6a7" stroke-width="3" stroke-dasharray="10 12" opacity=".7"/></g>`,
  chili: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-60 -30 C -20 -40 40 -10 70 50 C 30 20 -10 -6 -56 -14Z" fill="${lin("#ff5252", "#b71c1c")}"/>
    <path d="M-60 -30 C -70 -34 -76 -28 -80 -20 M-62 -26 q -4 -14 4 -20" stroke="#2E7D32" stroke-width="7" fill="none" stroke-linecap="round"/></g>`,
  grapes: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    ${[[-30, -30], [0, -34], [30, -30], [-18, -6], [14, -6], [42, -6], [-34, -6], [-4, 18], [26, 18], [10, 42], [-20, 40]]
      .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="17" fill="${grad("#b39ddb", "#6a1b9a", "#3e0f5c")}"/>`)
      .join("")}<path d="M0 -50 C 0 -64 6 -72 14 -78" stroke="#5d3a1a" stroke-width="5" fill="none"/>${leaf(10, -70, 0.6, -10)}</g>`,
  mango: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-50 -40 C -10 -80 70 -40 66 20 C 62 70 -30 72 -60 30 C -80 0 -66 -26 -50 -40Z" fill="${grad("#ffe082", "#ffa000", "#d84315")}"/>
    ${leaf(-40, -44, 0.7, -60)}${shine(-24, -20, 14, 20)}</g>`,
  eggplant: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(25)">
    <path d="M0 -50 C 40 -50 44 0 40 40 C 36 80 -36 80 -40 40 C -44 0 -40 -50 0 -50Z" fill="${grad("#9575cd", "#4a148c", "#1a0533")}"/>
    <path d="M-24 -50 Q 0 -30 24 -50 Q 10 -66 0 -64 Q -10 -66 -24 -50Z" fill="#2E7D32"/><path d="M0 -62 v-22" stroke="#2E7D32" stroke-width="7" stroke-linecap="round"/>${shine(-16, -10, 7, 20)}</g>`,
  garlic: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 -70 C 4 -50 60 -30 56 12 C 52 48 -52 48 -56 12 C -60 -30 -4 -50 0 -70Z" fill="${grad("#ffffff", "#f3e9dc", "#cbb79c")}"/>
    <path d="M0 -60 C -18 -20 -20 20 -6 44 M0 -60 C 18 -20 20 20 6 44 M -30 -20 C -40 10 -30 36 -20 44 M30 -20 C 40 10 30 36 20 44" stroke="#bfa98a" stroke-width="2.5" fill="none"/></g>`,
  ginger: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-70 10 C -74 -14 -46 -22 -30 -12 C -26 -40 0 -44 8 -20 C 20 -50 50 -40 46 -14 C 70 -16 80 14 58 26 C 40 40 -50 44 -70 10Z" fill="${grad("#f6deb0", "#d7a75c", "#9c6b2a")}"/>
    <path d="M-50 10 h20 M0 4 h18 M36 12 h14" stroke="#9c6b2a" stroke-width="2.5" stroke-linecap="round"/></g>`,
  cauliflower: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    ${leaf(-40, 30, 1, 200, "#43a047")}${leaf(40, 30, 1, -20, "#388e3c")}
    ${[[-30, -10, 28], [0, -24, 32], [30, -10, 28], [-14, 14, 26], [16, 14, 26]].map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${grad("#fffdf5", "#f3ead2", "#d6c79f")}"/>`).join("")}</g>`,
  pumpkin: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    ${[-40, -14, 14, 40].map((cx) => `<ellipse cx="${cx}" cy="6" rx="34" ry="52" fill="${grad("#ffcc80", "#f57c00", "#bf360c")}"/>`).join("")}
    <path d="M0 -42 q 4 -18 14 -22" stroke="#5d7a2a" stroke-width="8" fill="none" stroke-linecap="round"/></g>`,
  watermelon: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-80 -10 A 80 80 0 0 0 80 -10Z" fill="#2E7D32"/><path d="M-72 -10 A 72 72 0 0 0 72 -10Z" fill="#f1f8e9"/><path d="M-64 -10 A 64 64 0 0 0 64 -10Z" fill="${lin("#ff6f61", "#e53935")}"/>
    ${[[-30, 10], [0, 22], [30, 10], [-14, 34], [16, 34]].map(([cx, cy]) => `<ellipse cx="${cx}" cy="${cy}" rx="3" ry="5" fill="#1b1b1b"/>`).join("")}</g>`,
  bowl: (fill, dot, dotR = 4) => (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="-6" rx="80" ry="22" fill="${fill}"/>
    ${Array.from({ length: 34 }, (_, i) => `<circle cx="${Math.round(Math.cos(i * 2.4) * (8 + (i % 7) * 10))}" cy="${-10 + Math.round(Math.sin(i * 2.4) * (3 + (i % 5) * 3))}" r="${dotR}" fill="${dot}"/>`).join("")}
    <path d="M-84 -6 C -80 50 80 50 84 -6Z" fill="${lin("#a1887f", "#5d4037")}"/><path d="M-84 -6 C -80 6 80 6 84 -6" stroke="#4e342e" stroke-width="3" fill="none"/></g>`,
  mound: (c1, c2) => (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-70 -4 C -50 -60 50 -60 70 -4Z" fill="${grad(c1, c2, c2)}"/>
    <path d="M-84 -6 C -80 50 80 50 84 -6Z" fill="${lin("#eceff1", "#b0bec5")}"/><path d="M-84 -6 C -80 6 80 6 84 -6" stroke="#90a4ae" stroke-width="3" fill="none"/></g>`,
  bottle: (c) => (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-12" y="-96" width="24" height="18" rx="4" fill="#2E7D32"/>
    <path d="M-10 -78 h20 v14 C 36 -50 40 -30 40 -10 V 70 Q 40 80 30 80 H -30 Q -40 80 -40 70 V -10 C -40 -30 -36 -50 -10 -64Z" fill="${lin(c, "#c79a00", 1, 0)}" opacity=".95"/>
    <rect x="-30" y="0" width="60" height="44" rx="6" fill="#fff"/><path d="M-16 22 h32" stroke="#3FA34D" stroke-width="6" stroke-linecap="round"/>${shine(-26, -20, 5, 26)}</g>`,
  bag: (c, label) => (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-56 -70 L 56 -70 L 64 80 L -64 80Z" fill="${lin(c, "#d7ccc8", 1, 0)}"/>
    <path d="M-56 -70 l 10 -14 h 92 l 10 14" fill="#bcaaa4"/>
    <rect x="-40" y="-20" width="80" height="54" rx="8" fill="#fff"/><text x="0" y="14" font-family="Arial,Helvetica" font-weight="700" font-size="17" text-anchor="middle" fill="#166B3A">${label}</text></g>`,
  jar: (c) => (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-44" y="-74" width="88" height="22" rx="6" fill="#8d6e63"/>
    <rect x="-52" y="-54" width="104" height="134" rx="22" fill="${lin(c, "#e65100")}" opacity=".95"/>
    <rect x="-36" y="-6" width="72" height="44" rx="6" fill="#fff8e1"/>${shine(-36, -20, 6, 26)}</g>`,
  eggs: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    ${[[-44, 0], [0, -8], [44, 0], [-22, 20], [22, 20]].map(([cx, cy]) => `<ellipse cx="${cx}" cy="${cy}" rx="26" ry="34" fill="${grad("#fffaf0", "#f5deb3", "#c8a46e")}"/>`).join("")}</g>`,
};

const P = {
  "red-apple": [["apple", -50, 10, 0.9], ["apple", 55, 20, 0.85], ["apple", 0, 50, 1]],
  "green-apple": [["apple", -40, 20, 0.9, { hue: "green" }], ["apple", 40, 30, 1, { hue: "green" }]],
  orange: [["orange", -45, 20, 0.95], ["orange", 50, 30, 0.9]],
  banana: [["banana", 0, 10, 1.05], ["banana", 6, 40, 1]],
  mango: [["mango", -30, 20, 1], ["mango", 50, 40, 0.8]],
  grapes: [["grapes", 0, 20, 1.2]],
  watermelon: [["watermelon", 0, 20, 1.2]],
  lemon: [["lemon", -30, 10, 0.8], ["lemon", 40, 40, 0.8]],
  tomato: [["tomato", -50, 20, 0.85], ["tomato", 50, 26, 0.8], ["tomato", 0, 50, 0.95]],
  potato: [["potato", -40, 10, 0.85], ["potato", 46, 30, 0.8], ["potato", 0, 56, 0.9]],
  onion: [["onion", -40, 20, 0.85], ["onion", 46, 30, 0.85]],
  carrot: [["carrot", -24, 10, 1], ["carrot", 30, 16, 0.95]],
  broccoli: [["broccoli", 0, 10, 1.15]],
  cauliflower: [["cauliflower", 0, 20, 1.2]],
  spinach: [["spinach", 0, 20, 1.05]],
  cucumber: [["cucumber", 0, 0, 0.9], ["cucumber", 10, 46, 0.85]],
  eggplant: [["eggplant", -30, 10, 0.9], ["eggplant", 40, 20, 0.85]],
  pumpkin: [["pumpkin", 0, 20, 1.15]],
  chili: [["chili", -10, 0, 1], ["chili", 10, 40, 0.95]],
  garlic: [["garlic", -36, 20, 0.85], ["garlic", 44, 30, 0.8]],
  ginger: [["ginger", 0, 20, 1.2]],
  rice: [["rice", 0, 30, 1.1]],
  lentils: [["lentils", 0, 30, 1.1]],
  chickpeas: [["chickpeas", 0, 30, 1.1]],
  turmeric: [["turmeric", 0, 30, 1.1]],
  "chili-powder": [["chilipowder", 0, 30, 1.1]],
  cumin: [["cumin", 0, 30, 1.1]],
  "mustard-oil": [["mustardoil", 0, 10, 1.1]],
  flour: [["flour", 0, 10, 1.1]],
  sugar: [["sugar", 0, 10, 1.1]],
  honey: [["honey", 0, 10, 1.1]],
  eggs: [["eggs", 0, 20, 1.1]],
};
Object.assign(items, {
  rice: items.bowl("#fffdf7", "#f3ead2", 3.5),
  lentils: items.bowl("#ffcc80", "#ef6c00", 4),
  chickpeas: items.bowl("#f1d49a", "#c9974f", 6),
  turmeric: items.mound("#ffe082", "#f9a825"),
  chilipowder: items.mound("#ff8a65", "#c62828"),
  cumin: items.bowl("#bcaaa4", "#6d4c41", 3),
  mustardoil: items.bottle("#ffd54f"),
  flour: items.bag("#fff8e1", "ATTA"),
  sugar: items.bag("#ffffff", "SUGAR"),
  honey: items.jar("#ffb300"),
});

function render(name, parts, bg = "#EEF7EC") {
  gid = 0;
  defs.length = 0;
  let body = parts
    .map(([k, x, y, s, o]) => {
      let svg = items[k](x, y, s);
      if (o?.hue === "green") svg = svg.replace(/url\(#g(\d+)\)/, () => grad("#e6f5a1", "#8bc34a", "#4b7f1a"));
      return svg;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-160 -160 320 320" role="img" aria-label="${name} illustration">
<defs>${defs.join("")}</defs>
<rect x="-160" y="-160" width="320" height="320" fill="#fff"/>
<circle r="128" fill="${bg}"/>
<ellipse cx="0" cy="110" rx="110" ry="12" fill="#0b4d2c" opacity=".08"/>
${body}
</svg>`;
}

mkdirSync("public/images/products", { recursive: true });
for (const [k, parts] of Object.entries(P)) writeFileSync(`public/images/products/${k}.svg`, render(k, parts));

// Hero composition: basket of produce on a table.
function hero() {
  gid = 0;
  defs.length = 0;
  const produce = [
    ["broccoli", 240, -30, 0.9],
    ["banana", 120, -110, 0.9],
    ["grapes", 30, -90, 0.9],
    ["apple", -80, -80, 0.8],
    ["orange", -10, -40, 0.85],
    ["apple", 90, -40, 0.75],
    ["tomato", -180, 70, 0.8],
    ["tomato", -90, 90, 0.85],
    ["carrot", 260, 80, 0.9],
    ["cucumber", 330, 100, 0.8],
    ["spinach", -250, -10, 0.9],
  ];
  const basket = `<g><path d="M-170 -20 C -160 120 160 120 170 -20Z" fill="${lin("#d7a86e", "#8d5a2b")}"/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M-160 ${-6 + i * 14} C -60 ${10 + i * 14} 60 ${10 + i * 14} 160 ${-6 + i * 14}" stroke="#7a4b20" stroke-width="3" fill="none" opacity=".45"/>`).join("")}
    <path d="M-150 -30 C -130 -190 130 -190 150 -30" stroke="#a0703c" stroke-width="14" fill="none"/></g>`;
  const back = produce.slice(0, 6).map(([k, x, y, s]) => items[k](x, y, s)).join("");
  const front = produce.slice(6).map(([k, x, y, s]) => items[k](x, y, s)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-400 -230 800 400" role="img" aria-label="Basket of fresh fruits and vegetables">
<defs>${defs.join("")}</defs>
<ellipse cx="0" cy="150" rx="380" ry="26" fill="#3e2a12" opacity=".18"/>
${back}${basket}${front}
</svg>`;
}
mkdirSync("public/images", { recursive: true });
writeFileSync("public/images/hero-basket.svg", hero());

function heroSingle(parts, label) {
  gid = 0;
  defs.length = 0;
  const body = parts.map(([k, x, y, s]) => items[k](x, y, s)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -200 600 360" role="img" aria-label="${label}"><defs>${defs.join("")}</defs><ellipse cx="0" cy="140" rx="280" ry="20" fill="#3e2a12" opacity=".15"/>${body}</svg>`;
}
writeFileSync(
  "public/images/hero-organic.svg",
  heroSingle([["spinach", -170, 0, 1.1], ["broccoli", -40, -10, 1.1], ["cauliflower", 100, 30, 1], ["carrot", 210, 10, 1], ["cucumber", 0, 100, 0.9]], "Organic vegetables"),
);
writeFileSync(
  "public/images/hero-fruits.svg",
  heroSingle([["watermelon", -150, 40, 1.1], ["mango", 0, 0, 1.1], ["grapes", 150, -10, 1], ["orange", 70, 90, 0.8], ["banana", -60, 100, 0.9]], "Seasonal fruits"),
);
console.log("Generated", Object.keys(P).length, "product illustrations + hero art");
