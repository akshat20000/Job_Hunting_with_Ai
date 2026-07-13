import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_AUTOMATION_API: process.env.AUTOMATION_ENGINE_URL || 'http://localhost:3001',
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
