/** @type {import('next').NextConfig} */
const nextConfig = {
  // libsql / better-sqlite native-ish deps must not be bundled by webpack on the server
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
