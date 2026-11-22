<!--
Thanks for contributing! For documentation changes, fill in the checklist below.
For code changes, describe what changed and how you tested it, and delete the checklist.
-->

## What does this PR change?

<!-- Which pages are added or updated, and why. Link the related issue, e.g. Zarestia-Dev/rclone-manager#123. -->

## Documentation checklist

- [ ] Pages are Markdown files under `public/docs/` in the right section (`getting-started/`, `user-guide/`, `platform/`, `support/`, `development/`).
- [ ] New pages are listed in `public/docs/sidebar.md`.
- [ ] Links between pages are relative (e.g. `../user-guide/mounting.md`) and point to files that exist.
- [ ] Images are in `public/docs/assets/` and referenced with relative paths.
- [ ] UI labels match the current app (button and setting names as they appear in RClone Manager).
- [ ] `npx prettier --check "public/docs/**/*.md"` passes.
- [ ] Search index rebuilt with `node scripts/build-search-index.js` (it is also rebuilt by `npm run build`).
- [ ] Checked the page renders with `npm start` at `http://localhost:4200/docs/<page-name>`.
