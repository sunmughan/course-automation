import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network IP access for testing from mobile and other devices
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "*.local",
  ],
};

export default nextConfig;
