# Contributing to Albion Online Omni-Dashboard

Thank you for your interest in contributing to the Albion Online Omni-Dashboard! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and collaborative. We're building this for the Albion Online community.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/albion-omni-dashboard.git
   cd albion-omni-dashboard
   ```

3. **Install dependencies**
   ```bash
   bun install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials

5. **Run the development server**
   ```bash
   bun run dev
   ```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Example: `feature/add-crafting-calculator`

### Commit Messages

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Maintenance

Example: `feat: add arbitrage calculator with WASM optimization`

### Code Style

- **TypeScript**: Use strict mode, no `any` types
- **Formatting**: Run `bun run format` before committing
- **Linting**: Run `bun run lint` and fix all issues
- **Testing**: Add tests for new features

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**: `bun run test`
4. **Update README.md** if adding features
5. **Create PR** with clear description

## Project Structure

```
src/
├── app/              # Next.js pages (App Router)
├── components/       # React components
├── lib/             # Core libraries
│   ├── api/         # API clients
│   ├── supabase/    # Supabase client
│   └── utils/       # Utilities
├── hooks/           # Custom React hooks
├── types/           # TypeScript types
└── tests/           # Test files
```

## API Guidelines

### Adding New API Clients

1. Create client in `src/lib/api/[service]/client.ts`
2. Use Zod for response validation
3. Export singleton instance
4. Add TypeScript types
5. Write tests

### Error Handling

```typescript
try {
  const data = await apiClient.getData();
  return data;
} catch (error) {
  console.error('API Error:', error);
  throw new Error('Failed to fetch data');
}
```

## Testing

### Unit Tests

```bash
bun run test
```

### Coverage

```bash
bun run test:coverage
```

Aim for >80% coverage on new code.

## Performance

- Use React Server Components where possible
- Implement proper caching strategies
- Optimize images with Next.js Image
- Lazy load heavy components

## Accessibility

- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast ratios

## Questions?

- Open an issue for bugs
- Start a discussion for feature ideas
- Join our Discord for real-time help

Thank you for contributing! 🎮
