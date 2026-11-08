/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.0.147', 'localhost', '127.0.0.1'],
  devIndicators: false,
  outputFileTracingExcludes: {
    '*': ['public/roms/**'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'classicgamezone.com',
      },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/games/roms/snes/:id.smc',
        destination: '/roms/:id.smc',
      },
      {
        source: '/games/roms/snes/:id.sfc',
        destination: '/roms/:id.smc',
      },
      {
        source: '/games/roms/snes/:id',
        destination: '/roms/:id.smc',
      },
      {
        source: '/api/rom/:id.smc',
        destination: '/roms/:id.smc',
      },
      {
        source: '/api/rom/:id',
        destination: '/roms/:id.smc',
      },
    ];
  },
};

export default nextConfig;
