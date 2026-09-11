import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DEPLOY_TARGET === "aws" ? { output: "export" as const } : {}),
};

export default nextConfig;
