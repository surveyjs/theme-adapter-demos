/** @type {import('next').NextConfig} */
import { applyLocalSurveyJs } from "../../scripts/webpack-surveyjs-dev.mjs";

const nextConfig = {
  reactStrictMode: true,
  // Local SurveyJS builds (when aliased) live outside this app's dir.
  experimental: {
    externalDir: true,
  },
  // survey-* ship ESM/source that Next must transpile. `@adapter/schemas` is
  // listed too so Next compiles it into the app's watch graph instead of
  // treating it as an external node_module — otherwise a running `next dev`
  // keeps serving the `dist/` it loaded at startup and never picks up schema
  // rebuilds.
  transpilePackages: [
    "survey-core",
    "survey-react-ui",
    "survey-creator-core",
    "survey-creator-react",
    "@adapter/schemas",
  ],
  webpack: (config, { dev }) => {
    // Keep resolving the workspace-linked @adapter/schemas through this app's
    // node_modules rather than its realpath.
    config.resolve.symlinks = false;
    // Alias survey-* to local builds in `next dev`, or in `next build` when
    // SURVEYJS_LIBV3 is set; otherwise use the published npm packages.
    return applyLocalSurveyJs(config, { dev });
  },
};

export default nextConfig;
