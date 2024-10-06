/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src/app', 'src/components'], // Lint these directories
  },
};

export default nextConfig;
