export default {
  commands: {
    all: {
      gather: {
        files: ["./"],
      },
    },
    code: {
      gather: {
        notes:
          "IMPORTANT: Only return the code, no commentary. Do not wrap the code in backticks.",
        files: ["./"],
      },
    },
    example: {
      gather: {
        files: ["src/config.ts"],
      },
    },
  },
};
