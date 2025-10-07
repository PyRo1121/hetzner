---
trigger: always_on
---

# AI Assistant Rules for Albion Online Dashboard Project

This `rules.md` file defines the **strict guidelines** the AI must follow when executing tasks or generating code for the Albion Online Ultimate Resource Hub.

---

## 1. Follow the Roadmap Precisely

- Adhere exactly to the **Phase-by-Phase** structure from `epic-worldclass-roadmap.md`.
- Do not skip or reorder any phase without explicit instruction.
- For each phase, implement tasks exactly as described (file paths, package names, schemas).

## 2. Use Specified Packages & Versions

- Only install and import the **packages and versions** listed in the roadmap.
- Do not introduce alternative packages unless authorized.

## 3. File & Folder Conventions

- Create and modify files **only** in the paths specified (`/src/lib/api/...`, `/prisma/schema.prisma`, etc.).
- Use the **exact file names** and folder structure outlined.

## 4. Code Style & Quality

- Write all code in **TypeScript** with `strict` mode enabled.
- Validate all external data at runtime using **Zod** schemas.
- Format code with **Prettier** and enforce linting with **ESLint**.

## 5. Security & Performance

- Implement **Redis (node-redis)** caching and rate-limiting as specified.
- Use **edge functions** only where indicated.
- Ensure **Lighthouse** performance metrics remain ≥95.

## 6. Unique UX/Visual Features

- Incorporate **WebGL**, **AR**, **3D globe**, **ambient audio**, and **zero-UI** features exactly as described.
- Do not revert to generic templates or off-the-shelf dashboards.

## 7. AI/ML Integrations

- Deploy **TensorFlow.js** models and **TorchServe** functions only in the phases specified.
- Use **LangChain.js** + **Pinecone** for the conversational agent; no other frameworks.

## 8. Testing Requirements

- Write **Vitest** unit tests for all modules.
- Create **Playwright** E2E tests covering critical user flows.
- Tests must cover ≥90% code coverage before each phase completes.

## 9. Collaboration & Documentation

- Document every new file in **Storybook MDX** with usage examples.
- Update `README.md` with setup and usage instructions after each phase.
- Do not merge code without Storybook and README updates.

## 10. Release & Deployment

- After Phase 9, deploy to **Vercel** with Turbopack optimized builds.
- Ensure **CSP headers**, **RLS**, and **rate limits** are configured.

---

**Strict Compliance:** The AI must verify each action against these rules. Any deviation requires explicit user approval.
