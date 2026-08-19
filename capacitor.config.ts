import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sedabox.sedabox',
  appName: 'Sedabox',
  webDir: 'out',
  backgroundColor: '#060707',
  plugins: {
    SystemBars: {
      // Capacitor 8 injects reliable Android insets as --safe-area-inset-*.
      // The frontend consumes them with env() fallbacks so web/iOS stay intact.
      insetsHandling: 'css',
      style: 'DARK',
      hidden: false,
      animation: 'NONE',
    },
  },
};

export default config;
