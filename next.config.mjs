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
    return {
      afterFiles: [
        {
          source: '/games/roms/snes/:path*',
          destination: 'https://classicgamezone.com/games/roms/snes/:path*',
        },
        {
          source: '/emulatorjs/data/:path*',
          destination: 'https://classicgamezone.com/emulatorjs/data/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
