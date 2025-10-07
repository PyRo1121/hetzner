# VSCode Configuration

This directory contains a world-class VSCode setup optimized for Next.js, TypeScript, Prisma, GraphQL, and Supabase development.

## 📁 Files Overview

### `settings.json`
Workspace settings optimized for:
- **Auto-formatting** on save with Prettier
- **ESLint** auto-fix on save
- **TypeScript** with inlay hints and path aliases
- **Tailwind CSS** IntelliSense with custom class detection
- **Prisma** and **GraphQL** formatting
- **File nesting** for cleaner explorer view
- **Git** integration and auto-fetch
- **Error Lens** for inline error display

### `extensions.json`
Recommended extensions for:
- Code quality (ESLint, Prettier, Biome, SonarLint)
- Framework support (Next.js, React, Tailwind, Prisma, GraphQL)
- Productivity (GitLens, Todo Tree, Path IntelliSense)
- Testing (Vitest Explorer)
- Database (Supabase)
- AI assistance (GitHub Copilot)

### `launch.json`
Debug configurations for:
- **Next.js server-side** debugging
- **Next.js client-side** debugging (Chrome)
- **Full-stack debugging** (compound configuration)
- **Vitest** test debugging (current file or all tests)

### `tasks.json`
Quick tasks for:
- Development server
- Build and type checking
- Linting and formatting
- Testing (with UI and coverage)
- Prisma operations (generate, migrate, studio)
- Clean and fresh install

### `snippets.code-snippets`
Custom snippets for:
- React components (functional, client, server)
- Next.js pages, layouts, and API routes
- GraphQL resolvers
- Prisma queries
- Custom hooks and Zustand stores
- React Query hooks
- Vitest test suites
- TypeScript interfaces and types

## 🚀 Quick Start

1. **Install Recommended Extensions**
   - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Run: `Extensions: Show Recommended Extensions`
   - Click "Install All Workspace Recommendations"

2. **Verify Settings**
   - Settings are automatically applied to this workspace
   - Check status bar for TypeScript version (should use workspace version)

3. **Start Debugging**
   - Press `F5` or go to Run & Debug panel
   - Select a debug configuration
   - Set breakpoints and start debugging

4. **Run Tasks**
   - Press `Ctrl+Shift+B` / `Cmd+Shift+B` for build task
   - Press `Ctrl+Shift+P` / `Cmd+Shift+P` → "Tasks: Run Task" for other tasks

5. **Use Snippets**
   - Type snippet prefix (e.g., `rfc`, `npage`, `gqlres`)
   - Press `Tab` to expand
   - Use `Tab` to navigate between placeholders

## 🎯 Key Features

### Auto-Formatting
- **On Save**: Prettier formats all supported files
- **On Save**: ESLint fixes auto-fixable issues
- **On Save**: Organize imports automatically

### Path Aliases
IntelliSense for path aliases:
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/types/*` → `./src/types/*`

### File Nesting
Related files are nested in the explorer:
- Test files nest under source files
- Config files nest under main files
- Style files nest under component files

### Tailwind IntelliSense
Works with:
- `className` prop
- `clsx()` function
- `cn()` utility
- `cva()` class variance authority

### TypeScript Inlay Hints
Shows inline hints for:
- Parameter names and types
- Variable types
- Return types
- Property types

## 🔧 Customization

### Personal Preferences
To override workspace settings with personal preferences:
1. Open User Settings (`Ctrl+,` / `Cmd+,`)
2. Modify settings (they take precedence over workspace settings)

### Theme
Default theme is "Default Dark Modern". To change:
1. `Ctrl+K Ctrl+T` / `Cmd+K Cmd+T`
2. Select your preferred theme

### Keybindings
Add custom keybindings in `keybindings.json`:
1. `Ctrl+K Ctrl+S` / `Cmd+K Cmd+S`
2. Click "Open Keyboard Shortcuts (JSON)"

## 📚 Resources

- [VSCode Docs](https://code.visualstudio.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs)
- [GraphQL Docs](https://graphql.org/learn/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 💡 Tips

1. **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) is your friend
2. **Quick Open** (`Ctrl+P` / `Cmd+P`) for fast file navigation
3. **Go to Symbol** (`Ctrl+Shift+O` / `Cmd+Shift+O`) to navigate within files
4. **Multi-cursor** (`Alt+Click` / `Option+Click`) for simultaneous edits
5. **Zen Mode** (`Ctrl+K Z` / `Cmd+K Z`) for distraction-free coding
6. **Split Editor** (`Ctrl+\` / `Cmd+\`) for side-by-side editing
7. **Integrated Terminal** (`` Ctrl+` `` / `` Cmd+` ``) for quick commands

## 🐛 Troubleshooting

### TypeScript not working
1. Ensure workspace TypeScript is selected: `Ctrl+Shift+P` → "TypeScript: Select TypeScript Version" → "Use Workspace Version"
2. Restart TS Server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### ESLint not auto-fixing
1. Check ESLint output panel for errors
2. Ensure `.eslintrc.*` exists in workspace root
3. Restart ESLint Server: `Ctrl+Shift+P` → "ESLint: Restart ESLint Server"

### Prettier not formatting
1. Ensure `.prettierrc` exists in workspace root
2. Check file is not in `.prettierignore`
3. Verify Prettier extension is enabled

### Extensions not installing
1. Check internet connection
2. Reload VSCode: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check Extensions view for errors
