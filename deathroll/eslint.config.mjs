import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["src/components/ui/*"],
  },
];

export default eslintConfig;
