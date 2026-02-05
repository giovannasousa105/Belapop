const nextConfig = require("eslint-config-next");
const belaPopPlugin = require("./eslint-plugin-bela-pop");

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
