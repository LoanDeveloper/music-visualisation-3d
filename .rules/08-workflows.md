# Common workflows

## Development workflows

- Add theme: update colorPalettes.js, update themeMap in App.jsx, verify ThemeSelector.
- Adjust particle behavior: edit ParticleSystem.update formulas only.
- Change particle count: update ThreeScene constructor or setParticleCount + performanceMonitor.
- Add new control: create component in src/components, wire in App.jsx.
- After core changes, test in browser with a real audio file.
- Useful commands: npm run dev, npm run build, npm run preview.

## Quick commit workflow

When committing changes, use atomic commits with conventional commit messages:

```bash
# Format: type(scope): description
git add <files>
git commit -m "type(scope): short description"
```

### Commit types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no new feature, no bug fix)
- `chore`: Build process, dependencies, tooling
- `docs`: Documentation only
- `style`: Formatting, whitespace (no code change)
- `perf`: Performance improvement
- `test`: Adding or updating tests

### Examples
```bash
git commit -m "feat(particles): add spiral motion pattern"
git commit -m "fix(audio): resolve context resume on Safari"
git commit -m "chore(deps): update Three.js to v0.182"
git commit -m "refactor(hooks): extract audio logic to custom hook"
```

### Quick commit checklist
1. Stage only related files (avoid mixing unrelated changes)
2. Write message in imperative mood ("add" not "added")
3. Keep description under 72 characters
4. Reference issue number if applicable: `fix(audio): resolve playback #42`
5. Push after commit to keep remote in sync: `git push`

### Full quick commit flow
```bash
git add <files>
git commit -m "type(scope): short description"
git push
```
