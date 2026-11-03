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
};

export default nextConfig;
