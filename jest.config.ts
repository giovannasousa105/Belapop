import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testEnvironmentOptions: {},
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  // Testes de componente React precisam de jsdom
  projects: [
    {
      displayName: "node",
      preset: "ts-jest",
      testEnvironment: "node",
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
        "^server-only$": "<rootDir>/__mocks__/server-only.js",
      },
      testMatch: [
        "<rootDir>/lib/copilot/guards/__tests__/cooldownGuard.test.ts",
        "<rootDir>/lib/copilot/guards/__tests__/feedLimitGuard.test.ts",
        "<rootDir>/lib/copilot/__tests__/**/*.test.ts",
        "<rootDir>/lib/seller/__tests__/**/*.test.ts",
        "<rootDir>/lib/seller/invariants/__tests__/**/*.test.ts",
        "<rootDir>/lib/admin/invariants/__tests__/**/*.test.ts",
        "<rootDir>/lib/catalogo/invariants/__tests__/**/*.test.ts",
        "<rootDir>/lib/homepage/invariants/__tests__/**/*.test.ts",
        "<rootDir>/lib/digitalTwin/__tests__/**/*.test.ts",
        "<rootDir>/lib/popclub/invariants/__tests__/**/*.test.ts",
        "<rootDir>/lib/skinScan/__tests__/**/*.test.ts",
        "<rootDir>/lib/lote/__tests__/**/*.test.ts",
      ],
    },
    {
      displayName: "jsdom",
      preset: "ts-jest",
      testEnvironment: "jest-environment-jsdom",
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
      testMatch: [
        "<rootDir>/lib/copilot/guards/__tests__/optimisticResponse.test.ts",
      ],
    },
  ],
};

export default config;
