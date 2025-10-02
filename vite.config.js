import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const processEnvValues = {};
  for (const key in env) {
    if (key.startsWith('REACT_APP_')) {
      processEnvValues[`import.meta.env.${key}`] = JSON.stringify(env[key]);
    }
  }

  return {
    plugins: [react()],
    define: {
      global: 'window', // Explicitly define `global`
    },
    resolve: {
      alias: {
        './runtimeConfig': './runtimeConfig.browser',
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
    },
  };
});
