/** @type {import('next').NextConfig} */
import { applyLocalSurveyJs } from "../../scripts/webpack-surveyjs-dev.mjs";

const nextConfig = {
  reactStrictMode: true,
  // Local SurveyJS builds (when aliased) live outside this app's dir.
  experimental: {
    externalDir: true,
  },
  // survey-* ship ESM/source that Next must transpile. `@adapter/schemas` is a
  // workspace package that resolves to its realpath under packages/, which
  // `experimental.externalDir` above already pulls into the compilation; it is
  // listed here so the entry survives if that flag ever goes away.
  transpilePackages: [
    "survey-core",
    "survey-react-ui",
    "survey-creator-core",
    "survey-creator-react",
    "@adapter/schemas",
  ],
  webpack: (config, { dev }) => {
    // Alias survey-* to local builds in `next dev`, or in `next build` when
    // SURVEYJS_LIBV3 is set; otherwise use the published npm packages.
    return applyLocalSurveyJs(config, { dev });
  },
};

export default nextConfig;
