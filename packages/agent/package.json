{
  "name": "@philschmid/agent",
  "version": "0.2.1",
  "type": "module",
  "bin": {
    "agent": "./dist/cli.js"
  },
  "description": "Agent wrapper with hooks system for @philschmid/agents-core",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "skills",
    "subagents",
    "LICENSE",
    "README.md"
  ],
  "scripts": {
    "build": "tsup",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "lint": "biome check .",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@mozilla/readability": "^0.6.0",
    "@philschmid/agents-core": "workspace:*",
    "gray-matter": "^4.0.3",
    "html-to-markdown-node": "^2.18.0",
    "impit": "^0.9.1",
    "jsdom": "^28.0.0",
    "p-limit": "^7.2.0",
    "playwright-core": "^1.58.1",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/bun": "^1.3.8",
    "@types/jsdom": "^27.0.0",
    "@types/node": "^22.8.0",
    "tsup": "^8.3.0",
    "typescript": "^5.6.3"
  },
  "keywords": [
    "ai",
    "agents",
    "hooks",
    "gemini",
    "typescript"
  ],
  "author": "Philipp Schmid",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/philschmid/ia-agents.git",
    "directory": "packages/agent"
  },
  "bugs": {
    "url": "https://github.com/philschmid/ia-agents/issues"
  },
  "homepage": "https://github.com/philschmid/ia-agents/tree/main/packages/agent#readme",
  "license": "Apache-2.0",
  "publishConfig": {
    "access": "public"
  }
}
