import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'np.edvantage.app',
  appName: 'Ed-Vantage',
  // Static assets only — the real app loads from the deployed URL below,
  // because all privileged logic (auth, admin, scraping) runs server-side.
  webDir: 'public',
  server: {
    url: 'https://bnks-2.vercel.app/',
    cleartext: false,
  },
}

export default config
