import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'work.trainup.app',
  appName: 'TrainUp',
  webDir: 'dist/app/browser',
  plugins: {
    FirebaseAuthentication: {
      // Native SDKs only fetch the token; the Firebase JS SDK (used by Firestore) signs in with it.
      skipNativeAuth: true,
      providers: ['google.com', 'apple.com']
    }
  },
  experimental: {
    ios: {
      spm: {
        swiftToolsVersion: '6.1',
        packageOptions: {
          '@capacitor-firebase/authentication': { symlink: true }
        },
        // GoogleSignIn only; leaves out the Facebook SDK.
        packageTraits: {
          '@capacitor-firebase/authentication': ['Google']
        }
      }
    }
  }
};

export default config;
