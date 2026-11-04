/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.0.147', 'localhost', '127.0.0.1'],
  devIndicators: false,
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
        destination: '/api/rom/:id',
      },
      {
        source: '/games/roms/snes/:id.sfc',
        destination: '/api/rom/:id',
      },
      {
        source: '/games/roms/snes/:id',
        destination: '/api/rom/:id',
      },
    ];
  },
};

export default nextConfig;
