# AGENTS.md

use PRETTIER.

use PNPM instead of NPM.

## RELEASE / PUBLISH (origin)

- Version source: `package.json` (+ lockfile). Every publish to origin ships a version bump (semver).
- `client.js` is generated and git-ignored — never commit it; releases rebuild it (`prepack`).
- Steps, in order:
  1. Bump `version` in `package.json`, sync lockfile.
  2. Update `CHANGELOG.md`: move `Unreleased` entries into `## [X.Y.Z] - YYYY-MM-DD`.
  3. Verify: format check + project test pass.
  4. Commit version + changelog.
  5. Tag release commit: `vX.Y.Z`.
  6. Push commit and tag (`git push origin <branch> --follow-tags`); `release.yml` then creates the GitHub Release from the `CHANGELOG.md` section automatically.
