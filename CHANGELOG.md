# Changelog

## Unreleased

- NEW: Improved the default exclusions to exclude more binary file types
- FIX: Fixed a bug where the `files` agent did not properly handle exclusions that started with a `!` character
- NEW: Added a built-in `function` agent for use in configured commands

## 0.3.0

- BREAKING: recon config files now use `.recon.config.mjs` instead of `.recon.config.js`, and require an export default statement.
- NEW: Added a built-in `notes` agent for use in configured commands
- NEW: recon can now send output to more than one destination at a time. For example, both clipboard and stdout.

## 0.2.0

- NEW: Added a built-in `notes` agent for use in configured commands
- BREAKING: Change ReconAgent from an abstract class to an interface
- General cleanup and refactoring

## 0.1.0

- Initial release