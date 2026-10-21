import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Environment = 'development' | 'staging' | 'production';

export const CURRENT_ENV: Environment =
  (process.env.APP_ENV as Environment) ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'development');

// Dynamically extract computer's local IP address from Metro connection for mobile devices
const debuggerHost = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;

// Validate IPv4 format. If running via tunnel (e.g., *.exp.direct), debuggerHost is a domain.
const isIpv4 = (host?: string): boolean => {
  if (!host) return false;
  return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
};

const rawHost = debuggerHost ? debuggerHost.split(':')[0] : undefined;
const detectedIp = isIpv4(rawHost) ? rawHost! : '10.159.127.240';

// Web browser uses localhost:5000 or current window host
// Mobile devices use computer IP (derived dynamically from Metro debugger host or fallback IP)
const resolveDevUrl = (): string => {
  if (Platform.OS === 'web') {
    // If in web browser on laptop, target localhost or the exact host the web app was served from
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000/api';
      }
      return `http://${host}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }

  // If an HTTPS tunnel URL or external service is set in env, prioritize it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && (envUrl.startsWith('https://') || envUrl.includes('.loca.lt') || envUrl.includes('.ngrok'))) {
    return envUrl;
  }

  // On physical device / Expo Go: prioritize the IP that phone successfully used to connect to Metro
  if (isIpv4(rawHost)) {
    return `http://${rawHost}:5000/api`;
  }

  // Fallback to configured env URL or current active host IP
  return envUrl || `http://${detectedIp}:5000/api`;
};

const defaultDevUrl = resolveDevUrl();

const ENV_CONFIG = {
  development: {
    apiUrl: defaultDevUrl,
    appName: 'AyurSutra (Dev)',
    enableLogs: true,
  },
  staging: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.ayursutra.com/api',
    appName: 'AyurSutra (Staging)',
    enableLogs: true,
  },
  production: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.ayursutra.com/api',
    appName: 'AyurSutra',
    enableLogs: false,
  },
};

export const config = ENV_CONFIG[CURRENT_ENV] || ENV_CONFIG.development;

export const API_BASE_URL = config.apiUrl;

export default config;
