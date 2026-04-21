# scripts/

## `ci-tests.yml` — pending CI workflow

The GitHub Actions workflow lives here instead of `.github/workflows/` because the `gh` CLI token used during initial push lacked the `workflow` OAuth scope. To activate CI:

```bash
gh auth refresh -h github.com -s workflow
mkdir -p .github/workflows
mv scripts/ci-tests.yml .github/workflows/tests.yml
git add .github/workflows/tests.yml
git commit -m "ci: enable test + ruff workflow"
git push
```

That's the only remaining manual step from the Phase 0–9 scaffold.
