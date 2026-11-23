import type { NextConfig } from "next";

// `cacheComponents` (padrão do create-next-app 16) foi desligado de propósito:
// com ele ativo, o Next não aceita `export const revalidate` na página, e a
// agenda usa ISR com `revalidate = 3600` para tirar eventos que já passaram.
const nextConfig: NextConfig = {
  images: {
    // Imagens dos eventos vêm do Sympla.
    remotePatterns: [{ protocol: "https", hostname: "images.sympla.com.br" }],
  },
};

export default nextConfig;
