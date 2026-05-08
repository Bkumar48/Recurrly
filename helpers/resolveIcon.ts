import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";

type MCIName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * Well-known brand/service → MaterialCommunityIcons name mapping.
 * Keys are lowercase so look-ups are case-insensitive.
 */
const BRAND_MAP: Record<string, MCIName> = {
  netflix: "netflix",
  spotify: "spotify",
  github: "github",
  youtube: "youtube",
  "youtube tv": "youtube-tv",
  "youtube premium": "youtube",
  "youtube music": "youtube",
  slack: "slack",
  discord: "discord",
  twitch: "twitch",
  twitter: "twitter",
  x: "twitter",
  reddit: "reddit",
  pinterest: "pinterest",
  facebook: "facebook",
  instagram: "instagram",
  whatsapp: "whatsapp",
  snapchat: "snapchat",
  linkedin: "linkedin",
  telegram: "telegram",
  hulu: "hulu",
  dropbox: "dropbox",
  google: "google",
  "google drive": "google-drive",
  "google one": "google-cloud",
  "google cloud": "google-cloud",
  gmail: "gmail",
  apple: "apple",
  "apple tv": "apple",
  "apple music": "apple",
  icloud: "apple-icloud",
  "icloud+": "apple-icloud",
  microsoft: "microsoft",
  "microsoft 365": "microsoft-office",
  office: "microsoft-office",
  "office 365": "microsoft-office",
  onedrive: "microsoft-onedrive",
  outlook: "microsoft-outlook",
  teams: "microsoft-teams",
  xbox: "microsoft-xbox",
  "xbox game pass": "microsoft-xbox",
  "game pass": "microsoft-xbox",
  "visual studio": "microsoft-visual-studio",
  "vs code": "microsoft-visual-studio-code",
  vscode: "microsoft-visual-studio-code",
  azure: "microsoft-azure",
  aws: "amazon",
  amazon: "amazon",
  "amazon prime": "amazon",
  "prime video": "amazon",
  steam: "steam",
  playstation: "sony-playstation",
  "ps plus": "sony-playstation",
  "playstation plus": "sony-playstation",
  nintendo: "nintendo-switch",
  "nintendo switch": "nintendo-switch",
  adobe: "adobe",
  "creative cloud": "adobe",
  photoshop: "adobe",
  illustrator: "adobe",
  premiere: "adobe",
  figma: "drawing",
  canva: "palette",
  notion: "notebook",
  obsidian: "notebook-outline",
  evernote: "elephant",
  todoist: "checkbox-marked-circle",
  trello: "trello",
  jira: "jira",
  asana: "checkbox-multiple-marked",
  linear: "ray-start-arrow",
  openai: "robot",
  chatgpt: "robot",
  "chat gpt": "robot",
  claude: "robot-outline",
  anthropic: "robot-outline",
  midjourney: "image-auto-adjust",
  copilot: "robot-happy",
  "github copilot": "robot-happy",
  cursor: "cursor-default",
  vercel: "triangle",
  netlify: "web",
  heroku: "cloud",
  "digital ocean": "water",
  digitalocean: "water",
  cloudflare: "cloud-outline",
  zoom: "video",
  "google meet": "video",
  medium: "alpha-m-box",
  substack: "newspaper",
  "new york times": "newspaper-variant",
  nyt: "newspaper-variant",
  "wall street journal": "newspaper-variant-outline",
  wsj: "newspaper-variant-outline",
  "the athletic": "basketball",
  duolingo: "translate",
  grammarly: "spellcheck",
  "1password": "lock",
  lastpass: "lock-outline",
  bitwarden: "shield-lock",
  nordvpn: "shield-check",
  expressvpn: "vpn",
  surfshark: "shark",
  vpn: "vpn",
  headspace: "meditation",
  calm: "weather-night",
  strava: "bike",
  peloton: "bike",
  fitbit: "heart-pulse",
  myfitnesspal: "food-apple",
  uber: "car",
  "uber eats": "food",
  lyft: "car-outline",
  doordash: "food-takeout-box",
  grubhub: "food-fork-drink",
  instacart: "cart",
  walmart: "cart-outline",
  costco: "store",
  tidal: "music",
  "apple music": "music",
  deezer: "music-note",
  pandora: "music-box",
  soundcloud: "soundcloud",
  audible: "headphones",
  kindle: "book-open-variant",
  "kindle unlimited": "book-open-variant",
  scribd: "book-multiple",
  "disney+": "movie-open",
  disney: "movie-open",
  "hbo max": "movie",
  hbo: "movie",
  max: "movie",
  "paramount+": "movie-star",
  paramount: "movie-star",
  peacock: "movie-outline",
  crunchyroll: "filmstrip",
  funimation: "filmstrip-box",
};

/**
 * Category-based fallback icons when no brand match is found.
 */
const CATEGORY_FALLBACKS: Record<string, MCIName> = {
  entertainment: "movie-open-outline",
  "ai tools": "robot-outline",
  "developer tools": "code-braces",
  design: "palette-outline",
  productivity: "lightning-bolt",
  cloud: "cloud-outline",
  music: "music",
  other: "apps",
};

/**
 * Resolve a subscription name to a MaterialCommunityIcons glyph name.
 *
 * 1. Exact brand match (case-insensitive)
 * 2. Partial / contains match against brand map keys
 * 3. Category-based fallback
 * 4. Generic "apps" fallback
 */
export function resolveIconName(
  subscriptionName: string,
  category?: string,
): MCIName {
  const query = subscriptionName.toLowerCase().trim();

  // 1 — exact match
  if (query in BRAND_MAP) {
    return BRAND_MAP[query];
  }

  // 2 — partial match: check if the query contains a brand key or vice-versa
  for (const [brand, icon] of Object.entries(BRAND_MAP)) {
    if (query.includes(brand) || brand.includes(query)) {
      return icon;
    }
  }

  // 3 — category fallback
  if (category) {
    const catKey = category.toLowerCase().trim();
    if (catKey in CATEGORY_FALLBACKS) {
      return CATEGORY_FALLBACKS[catKey];
    }
  }

  // 4 — generic
  return "apps";
}
