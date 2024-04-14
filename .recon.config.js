module.exports = {
  commands: {
    src: {
      prompt: "What version of Node.js is the project using?",
      gather: {
        files: ["./.nvmrc"],
      },
    },
  },
};
