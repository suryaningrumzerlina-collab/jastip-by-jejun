import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jastip by Jejun Admin',
    short_name: 'Jastip Jejun',
    description: 'Aplikasi admin pencatatan pesanan dan pengiriman Jastip by Jejun',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF5EB',
    theme_color: '#FAF5EB',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}