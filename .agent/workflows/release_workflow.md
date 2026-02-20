---
description: Workflow for managing changelog updates and version releases
---

# Release Workflow

This workflow guides the process of documenting changes and releasing new versions of the application.

## 1. Continuous Updates (During Development)

When making code changes (features, fixes, refactors):

1.  **Do NOT** bump the version number in `package.json` immediately.
2.  Add a bullet point describing the change to the `## [Unreleased]` section in `CHANGELOG.md`.
3.  If the `## [Unreleased]` section does not exist, create it at the top of the changelog list.
4.  Group changes by type: `### Added`, `### Changed`, `### Fixed`, `### Removed`.

## 2. Release / End of Day

When the user requests a version bump or "release" (e.g., at the end of the day):

1.  Review the changes in the `## [Unreleased]` section.
2.  Propose a new version number to the user based on [Semantic Versioning](https://semver.org/) (Major.Minor.Patch):
    *   **Major**: Incompatible API changes.
    *   **Minor**: Backward-compatible functionality.
    *   **Patch**: Backward-compatible bug fixes.
3.  Upon user approval of the version number:
    *   **Rewrite the `## [Unreleased]` section**: Condense the raw, chronological bullet points into a cohesive, grouped, and human-readable format highlighting major features and bug fixes.
    *   Rename `## [Unreleased]` to `## [VERSION] - YYYY-MM-DD`.
    *   Update the `version` field in `package.json`.
    *   Create a new empty `## [Unreleased]` section at the top of `CHANGELOG.md`.
4.  **Git Operations** (Best Practice):
    *   Stage the release files: `git add package.json CHANGELOG.md`
    *   Commit the release: `git commit -m "chore(release): v[VERSION]"`
    *   Create a git tag: `git tag v[VERSION]`
    *   Push to remote: `git push origin main && git push origin v[VERSION]`
