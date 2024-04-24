export default {
  commands: {
    src: {
      gather: {
        files: ["./*"],
      },
    },
    code: {
      gather: {
        notes: "IMPORTANT: Only return the code, no commentary. Do not wrap the code in backticks. Output the *entire* requested file.",
      }
    }
  },
};
