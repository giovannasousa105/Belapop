const nextConfigModule = require("eslint-config-next/core-web-vitals");
const belaPopPlugin = require("./eslint-plugin-bela-pop");

const nextConfig = Array.isArray(nextConfigModule)
  ? nextConfigModule
  : Array.isArray(nextConfigModule?.default)
    ? nextConfigModule.default
    : [];

module.exports = [
  ...nextConfig,
  {
    ignores: ["**/node_modules/**", "**/.next/**"],
    plugins: {
      "bela-pop": belaPopPlugin
    },
    rules: {
      "bela-pop/prefer-bela-pop": "warn",
      "react-hooks/set-state-in-effect": "off"
    }
  }
];
