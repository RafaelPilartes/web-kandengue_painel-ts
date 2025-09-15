// src/global.d.ts
export {}

declare global {
  interface Window {
    google: typeof google
  }

  const google: typeof import('@types/google.maps')
}
