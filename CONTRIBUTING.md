# Contributing to Albion Online Ultimate Resource Hub

We welcome contributions to the Albion Online Ultimate Resource Hub! This guide will help you get started with our unified development and deployment workflow.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Bun (required - we use Bun for all commands)
- Docker & Docker Compose
- Git
- Basic knowledge of Next.js, React, and TypeScript
- Understanding of our deployment architecture (see [Unified Deployment Guide](./UNIFIED-DEPLOYMENT-GUIDE.md))

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/albion-dashboard.git
   cd albion-dashboard
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Set up environment:
   ```bash
   cp scripts/infra/.env.example .env.local
   # Edit .env.local with your configuration
   ```
5. Start development server:
   ```bash
   bun dev
   ```

### Development Environment Options

#### Option 1: Local Development (Recommended)
```bash
# Standard local development
bun dev
```

#### Option 2: Docker Development
```bash
# Full stack with Docker
export DEPLOYMENT_MODE="development"
bash scripts/infra/deploy-unified-enterprise.sh
```

#### Option 3: Staging Environment
```bash
# Deploy to staging for testing
export DEPLOYMENT_MODE="staging"
bash scripts/infra/deploy-unified-enterprise.sh
```

## 📝 Development Guidelines

### Code Style & Standards
- **TypeScript**: Use strict mode for all new code
- **Formatting**: Prettier with ESLint enforcement
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Documentation**: Storybook MDX for component documentation
- **Performance**: Maintain Lighthouse scores ≥95

### Architecture Principles
- Follow the Phase-by-Phase roadmap structure
- Use specified packages and versions only
- Implement security-first development practices
- Maintain enterprise-grade code quality

### File & Folder Conventions
```
src/
├── app/                    # Next.js app router
├── components/             # React components
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions

scripts/infra/             # Infrastructure scripts
├── deploy-unified-enterprise.sh
├── coolify-integration.sh
├── environment-configs.sh
└── .env.example

.github/workflows/         # CI/CD workflows
├── deploy-production.yml
├── deploy-staging.yml
└── infrastructure-validation.yml
```

### Commit Messages
Follow conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks
- `infra:` for infrastructure changes
- `deploy:` for deployment-related changes

Example: `feat: add real-time price alerts with WebGL visualization`

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development integration branch
- `staging`: Staging environment branch
- `feature/*`: Feature development branches
- `hotfix/*`: Critical production fixes

## 🧪 Testing Requirements

### Test Coverage Standards
- **Unit Tests**: ≥90% code coverage required
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows
- **Performance Tests**: Lighthouse CI integration

### Running Tests
```bash
# Unit tests with Vitest
bun test

# E2E tests with Playwright
bun test:e2e

# Coverage report
bun test:coverage

# Performance tests
bun test:performance

# Infrastructure validation
bun run infra:validate
```

### Writing Tests
- Write tests before implementing features (TDD approach)
- Include edge cases and error scenarios
- Mock external dependencies appropriately
- Document test scenarios clearly

## 🚀 Deployment & CI/CD

### Local Testing
```bash
# Test deployment scripts locally
bash scripts/infra/deploy-unified-enterprise.sh --dry-run

# Validate infrastructure
bun run infra:validate

# Test staging deployment
export DEPLOYMENT_MODE="staging"
bash scripts/infra/deploy-unified-enterprise.sh
```

### CI/CD Pipeline
Our GitHub Actions workflows automatically:
- Validate code quality and tests
- Run infrastructure validation
- Deploy to staging on PR creation
- Deploy to production on merge to main
- Integrate with Coolify for zero-downtime deployments

### Environment-Specific Development
```bash
# Development environment
export NODE_ENV="development"
bun dev

# Staging environment testing
export NODE_ENV="staging"
export DEPLOYMENT_MODE="staging"

# Production-like testing
export NODE_ENV="production"
export DEPLOYMENT_MODE="docker-compose"
```

## 📚 Documentation Requirements

### Code Documentation
- JSDoc comments for all public APIs
- Storybook stories for all components
- README updates for significant changes
- API documentation for new endpoints

### Infrastructure Documentation
- Document any infrastructure changes
- Update deployment guides for new features
- Include troubleshooting steps
- Maintain environment variable documentation

### Required Documentation Updates
Before merging, ensure:
- [ ] Storybook stories are updated
- [ ] README.md reflects changes
- [ ] API documentation is current
- [ ] Deployment guides are updated

## 🔒 Security Guidelines

### Security Requirements
- Never commit secrets or API keys
- Use environment variables for all configuration
- Implement proper input validation
- Follow OWASP security guidelines
- Regular security audits with `bun audit`

### Security Scanning
```bash
# Run security audit
bun audit

# Check for vulnerabilities
bun run security:scan

# Validate infrastructure security
bun run infra:security-check
```

## 🐛 Bug Reports & Issues

### Bug Report Template
When reporting bugs, include:
- **Environment**: Development/Staging/Production
- **Deployment Mode**: Docker/Kubernetes/Local
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Logs**: Relevant error messages
- **System Info**: OS, browser, versions

### Issue Labels
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to docs
- `infrastructure`: Infrastructure-related issues
- `security`: Security-related issues
- `performance`: Performance improvements
- `good first issue`: Good for newcomers

## 💡 Feature Development

### Feature Request Process
1. Check existing issues and roadmap
2. Create detailed feature request
3. Discuss implementation approach
4. Get approval from maintainers
5. Implement following our guidelines

### Feature Development Workflow
1. Create feature branch from `develop`
2. Implement feature with tests
3. Update documentation
4. Test in staging environment
5. Submit pull request
6. Address review feedback
7. Merge after approval

## 📋 Pull Request Process

### PR Requirements
- [ ] Code follows style guidelines
- [ ] Tests pass with ≥90% coverage
- [ ] Documentation is updated
- [ ] Storybook stories are included
- [ ] Infrastructure changes are validated
- [ ] Security review completed
- [ ] Performance impact assessed

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Infrastructure change

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] Staging deployment tested

## Documentation
- [ ] README updated
- [ ] API docs updated
- [ ] Storybook stories added
- [ ] Deployment guides updated

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
```

## 🎯 Areas for Contribution

### High Priority
- **Performance Optimizations**: WebGL, caching, bundle size
- **Security Enhancements**: Authentication, authorization, data protection
- **Mobile Responsiveness**: Touch interfaces, responsive design
- **Accessibility**: WCAG compliance, screen reader support
- **Test Coverage**: Unit, integration, and E2E tests

### Medium Priority
- **New Features**: Market analysis tools, PvP tracking, guild management
- **UI/UX Improvements**: Design system, user experience
- **Documentation**: Guides, tutorials, API documentation
- **Infrastructure**: Deployment automation, monitoring

### Low Priority
- **Code Refactoring**: Technical debt, code organization
- **Developer Tooling**: Build tools, development experience
- **Example Applications**: Demos, tutorials

## 🛠️ Development Tools

### Required Tools
```bash
# Install development dependencies
bun install

# Set up pre-commit hooks
bun run prepare

# Install recommended VS Code extensions
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
```

### Recommended VS Code Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 📞 Getting Help

### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord Community**: Real-time chat and support
- **Documentation**: Comprehensive guides and references

### Maintainer Contact
- Create an issue for bugs or features
- Use discussions for questions
- Tag maintainers for urgent issues
- Follow up on stale PRs

## 📊 Performance Standards

### Performance Requirements
- **Lighthouse Score**: ≥95 for all metrics
- **Bundle Size**: Monitor and optimize
- **Load Time**: <3s for initial page load
- **Core Web Vitals**: Meet Google standards

### Performance Testing
```bash
# Run performance tests
bun run test:performance

# Analyze bundle size
bun run analyze

# Lighthouse CI
bun run lighthouse
```

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to the Albion Online Ultimate Resource Hub!** 🎉

Your contributions help build the best resource for the Albion Online community. Together, we're creating something amazing! 🏰✨
