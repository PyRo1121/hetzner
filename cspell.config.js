/**
 * cSpell Configuration for Albion Online Ultimate Resource Hub
 * Custom dictionary for Albion Online terms, Supabase, and technical jargon
 */
module.exports = {
  version: "0.2",
  language: "en",
  words: [
    // Supabase
    "supabase",
    "Supabase",
    "SUPABASE",

    // Albion Online Cities
    "Bridgewatch",
    "Lymhurst",
    "Martlock",
    "Thetford",
    "Caerleon",
    "Fortsterling",

    // Albion Online Weapons/Armor
    "HOLYSTAFF",
    "DIVINESTAFF",
    "SMITESTAFF",
    "FALLENSTAFF",
    "LIFETOUCHSTAFF",
    "REDEMPTIONSTAFF",
    "GREATHOLYSTAFF",
    "NATURESTAFF",
    "DRUIDSTAFF",
    "WILDSTAFF",
    "REJUVENATIONSTAFF",
    "IRONROOTSTAFF",
    "FRAIVESTAFF",
    "CAPEITEM",

    // Technical Terms
    "AODP",
    "PGRST",
    "maxage",
    "setex",
    "tfjs",
    "relu",
    "LSTM",
    "Crossentropy",
    "killfeed",
    "topkills",
    "weaponfame",
    "playerstats",
    "weaponcategories",
    "Gameinfo",
    "gameinfo",
    "aodp",

    // Machine Learning
    "TensorFlow",
    "TorchServe",
    "Pinecone",
    "LangChain",

    // WebGL/Graphics
    "WebGL",
    "Three.js",
    "Swipeable",

    // Project Specific
    "modelcontextprotocol",
    "deepwiki"
  ],
  ignoreWords: [],
  import: ["@cspell/dict-node", "@cspell/dict-typescript", "@cspell/dict-software-terms"],
  ignorePaths: [
    "node_modules/**",
    ".next/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "*.min.js",
    "bun.lock",
    "package-lock.json",
    "yarn.lock"
  ],
  overrides: [
    {
      filename: "**/*.{js,jsx,ts,tsx}",
      languageId: "javascript,typescript,javascriptreact,typescriptreact"
    },
    {
      filename: "**/*.md",
      languageId: "markdown"
    },
    {
      filename: "**/*.json",
      languageId: "json"
    }
  ]
};
