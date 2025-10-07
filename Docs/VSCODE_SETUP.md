# VS Code Setup Guide

## Recommended VS Code Settings

Since `.vscode/` is gitignored, you'll need to manually create these files in your local workspace.

### 1. Create `.vscode/settings.json`

Create a file at `.vscode/settings.json` in your project root with the following content:

```json
{
  // Editor
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.rulers": [100],
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,

  // Files
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,

  // Language-specific settings
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // ESLint
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],

  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always",

  // Prettier
  "prettier.requireConfig": true,
  "prettier.enable": true,

  // Tailwind CSS
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],

  // Search
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/out": true,
    "**/build": true,
    "**/.turbo": true,
    "**/coverage": true
  },

  // Files to watch
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true,
    "**/out/**": true
  }
}
```

### 2. Create `.vscode/extensions.json`

Create a file at `.vscode/extensions.json` to recommend extensions to your team:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "unifiedjs.vscode-mdx",
    "streetsidesoftware.code-spell-checker",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "zignd.html-css-class-completion",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

## Quick Setup Steps

1. Create the `.vscode` directory in your project root if it doesn't exist:
   ```bash
   mkdir .vscode
   ```

2. Copy the settings above into `.vscode/settings.json`

3. Copy the extensions list into `.vscode/extensions.json`

4. Install the recommended extensions when VS Code prompts you

5. Reload VS Code window (Ctrl+Shift+P → "Reload Window")

## What This Does

- **Auto-format on save** using Prettier
- **Auto-fix ESLint issues** on save
- **Auto-organize imports** on save
- **Consistent formatting** across the team
- **Better IntelliSense** for TypeScript and Tailwind CSS
- **Improved error visibility** with ErrorLens
