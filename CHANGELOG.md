# Changelog

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