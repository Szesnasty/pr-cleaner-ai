# Contributing to pr-cleaner-ai

Thank you for considering contributing to `pr-cleaner-ai`! 🎉

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pr-cleaner-ai.git
   cd pr-cleaner-ai
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Build the project:**
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** and test them:
   ```bash
   npm run build
   npm test  # if tests exist
   ```

3. **Commit your changes:**
   ```bash
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug in PR parsing"
   ```

   **Commit message format:**
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub

## Code Style

- **TypeScript** — strict mode enabled
- **ESLint** — follow existing code style
- **No console.log in production code** — use proper logging
- **Security first** — validate inputs, use `spawn()` not `exec()`, validate paths

## Testing

Before submitting a PR:

1. **Build successfully:**
   ```bash
   npm run build
   ```

2. **Test locally:**
   - Install in a test project: `npm install -D .`
   - Run `npx pr-cleaner-ai init`
   - Test with a real PR: `npx pr-cleaner-ai fetch --pr=<NUMBER>`

3. **Check for security issues:**
   ```bash
   npm audit --omit=dev
   ```

## Pull Request Guidelines

### Before Submitting

- ✅ Code builds without errors
- ✅ Code follows existing style
- ✅ No security vulnerabilities introduced
- ✅ Documentation updated (if needed)
- ✅ Commit messages are clear and descriptive

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code builds successfully
- [ ] No security issues introduced
- [ ] Documentation updated (if needed)
```

## Security Considerations

- **Never commit** personal access tokens or secrets
- **Use `spawn()` with array arguments** — never string concatenation for commands
- **Validate all inputs** — PR numbers, file paths, URLs
- **No network calls** in postinstall script
- **Path validation** — always use `path.resolve()`

## Areas for Contribution

We welcome contributions in these areas:

- 🐛 **Bug fixes** — especially edge cases in PR comment parsing
- 🚀 **Features** — new functionality that improves workflow
- 📚 **Documentation** — clearer examples, better README
- 🔒 **Security** — security improvements and hardening
- ⚡ **Performance** — optimization of API calls or file operations
- 🧪 **Tests** — adding test coverage

## Questions?

- **Open an issue** for questions or discussions
- **Check existing issues** before opening a new one
- **Be respectful** — we're all here to help

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints

---

Thank you for contributing! 🙏

