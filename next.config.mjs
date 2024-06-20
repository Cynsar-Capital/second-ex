/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "saranshsharma.me",
      },
    ],
  },
  env: {
    GHOST_URL: string,
  },
};

export default nextConfig;
