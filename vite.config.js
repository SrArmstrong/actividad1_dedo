import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Registro de Asistencia Académica',
        short_name: 'Asistencia',
        description: 'Aplicación progresiva para registrar asistencia en eventos académicos mediante captura de imagen con cámara del dispositivo',
        theme_color: '#1a202c',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 día
              }
            }
          },
          {
            urlPattern: /\.(js|css|html)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            }
          },
          {
            urlPattern: /\/users/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'users-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 2 // 2 horas
              }
            }
          }
        ],
        // Agrega esta opción para mejor soporte offline
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  server: {
    https: true,
    host: true
  }
})
