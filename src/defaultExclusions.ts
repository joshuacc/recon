// src/defaultExclusions.ts
export const defaultExclusions = [
    // Version control systems
    '**/.git/**',
    '**/.svn/**',
    '**/.hg/**',
    '**/.bzr/**',
  
    // Node.js
    '**/node_modules/**',
    '**/npm-debug.log*',
    '**/yarn-debug.log*',
    '**/yarn-error.log*',
    '**/.npm/**',
    '**/.yarn-integrity/**',
    '**/package-lock.json',
  
    // Logs
    '**/logs/**',
    '**/*.log',
    '**/npm-debug.log*',
    '**/yarn-debug.log*',
    '**/yarn-error.log*',
    '**/pnpm-debug.log*',
    '**/lerna-debug.log*',
  
    // Runtime data
    '**/pids/**',
    '**/*.pid',
    '**/*.seed',
    '**/*.pid.lock',
  
    // Dependency directories
    '**/jspm_packages/**',
    '**/web_modules/**',
  
    // TypeScript cache
    '**/*.tsbuildinfo',
  
    // Optional npm cache directory
    '**/.npm/**',
  
    // Output directories
    '**/build/**',
    '**/dist/**',
    '**/out/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.nuxt/**',
  
    // Cache directories
    '**/.cache/**',
    '**/.vuepress/dist/**',
    '**/.serverless/**',
    '**/.fusebox/**',
    '**/.dynamodb/**',
  
    // Misc
    '**/.DS_Store',
    '**/.env.local',
    '**/.env.development.local',
    '**/.env.test.local',
    '**/.env.production.local',
    '**/.env.*.local',
    '**/.cache',
    '**/.vscode-test',
    '**/.yarn-integrity',
    '**/.eslintcache',
    '**/*.pem',
    '**/*.tgz',
    '**/.yarn-integrity',
    '**/.env',
    '**/.env.*',
    '**/.vscode',
    '**/.idea',
    '**/*.suo',
    '**/*.ntvs*',
    '**/*.njsproj',
    '**/*.sln',
    '**/*.sw?',
  ];