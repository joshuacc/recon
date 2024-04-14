# recon - Gather background information to prompt LLMs

IMPORTANT: This is a work in progress. The documentation below is aspirational and may not reflect the current state of the project.

LLMs like Claude and ChatGPT can be extremely useful. But gathering up all the background information they need to provide appropriate answers can be painful. That's where `recon` comes in.

Running a simple command like `recon --file ./docs "What are the addresses for all of our internal servers?" | llm` beats manually looking through everything in the docs folder.

## Installation

- `npm i -g @joshuacc/recon` to install globally - Probably what most users want
- `npm i @joshuacc/recon` to use in a specific JS project

## Basic Usage

The `recon` command gathers information from various sources and combines it into a single prompt for use with an LLM. You can paste it to your clipboard for use with ChatGPT, write it to a file, or send it via `stdout` to combine it with other tools.

### Output

The `recon` command will output a text prompt in one of three ways:

- **Clipboard**: If the `--clipboard` flag is provided, the prompt will be copied to your clipboard.
- **File**: If the `--output` flag is provided, the prompt will be written to the specified file.
- **Stdout**: If neither `--clipboard` nor `--output` is provided, the prompt will be written to `stdout`. This can be useful for combining with other tools, like [llm](https://llm.datasette.io/en/stable/). Example: `recon --file ./docs "How do I debug docker problems for this project?" | llm`.

### Specifying what you want from the LLM (directions)

Example: `recon --file ./docs "What are the addresses for all of our internal servers?"`

In addition to the background information that `recon` gathers, you can optionally provide directions for the LLM which will be included in the final prompt. It must be the final non-flag argument.

### Gathering files

Example: `recon --file ./docs`

You can specify files for `recon` to gather in several ways.

- **Directories**: You can provide the path to a directory, and `recon` will recursively search through all the files in that directory.

- **Globs**: Globs are like wildcards, and can be used to specify multiple files or directories. For example, `recon --file ./docs/**/*.md` will gather information from all markdown files in the `docs` directory and its subdirectories.

- **Files**: You can specify a single file, and `recon` will gather information from that file. For example, `recon --file ./docs/server_info.md`.

- **Comma Separated**: To provide multiple sources, you can provide them as a comma-separated list. For example, `recon --file ./docs,./src/**/*.tsx`.

- **Exclusions**: You can exclude files or directories by prefixing them with a `!`. For example, `recon --file ./docs,./src/**/*.tsx,!./src/secret.tsx`.

NOTE: `recon` excludes some files and directories by default. These are `.git`, `node_modules`, and others. To see the complete list, see `src/defaultExclusions.ts`.

### Gathering urls

Example: `recon --urls https://example.com`

To gather information from a website, use the `--urls` option followed by the URL. `recon` will send a GET request to the URL and place the response into the prompt.

### Gather from multiple sources

Example: `recon --file ./docs --urls https://example.com`

You can gather information from multiple sources by providing multiple `--file` and `--urls` options.

### Creating recon commands as shortcuts

If you have a specific set of sources you want to gather information from frequently, you can define your own `recon` commands.

Create a `.recon.config.js` file in the root of your project or in your home directory. For example:

```js
module.exports = {
  commands: {
    // The key is the name of the command
    docs: {
      gather: {
        files: ['./docs'],
        urls: ['https://example.com/some-more-docs']
      }
    }
  }
};
```

You can then run your command with `recon docs` and pass in any additional arguments, such as directions. For example: `recon docs "How do I reset my local db?"`. If you pass in more `--files` or `--urls` options, they will be merged with the ones defined in the command.

#### Config merging

If you have a `.recon.config.js` file in your home directory and one in the root of your project, the two will be merged. The project-level config will take precedence over the home-level config. Though it will print a warning if there are conflicting command definitions.

## Advanced usage

### Creating your own recon agents

You can create your own recon agents by extending the `ReconAgent` class and implementing the `gather` method. This method should return a promise that resolves with the gathered information. You can then use your custom recon agent with the `--agent` option.

More details to come.

Examples to add: 
- db queries
- connecting to stripe

## Configuration format

```js
// This is a hypothetical recon agent for accessing database information
const MyDbAgent = require('./myDbAgent');

module.exports = {
  agents: [MyDbAgent]
  commands: {
    // The key is the name of the command
    growth: {
      // The default directions for this command
      directions: "How are we doing on our growth goals?",
      // The `gather` object must be provided, and must have at least one key
      // specifying an agent to use
      gather: {
        // The default set of files to gather information from
        files: ['./docs/business-plan.md'],
        // The default set of urls to gather information from
        urls: ['https://example.com/'],
        // This will be used by MyDbAgent to gather more information for the prompt
        myDb: {
          query: 'SELECT COUNT(*) FROM users',
        }
      }
    },
  }
};
```

For full details on the configuration format, see `src/config.ts`.
