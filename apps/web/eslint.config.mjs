import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import liftupNextConfig from "@liftup/eslint-config/next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...liftupNextConfig,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
