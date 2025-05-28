import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.AIzaSyDy-xeGHFyacW1dvmxX9lGC0MXhc4XHEZE),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.AIzaSyDy-xeGHFyacW1dvmxX9lGC0MXhc4XHEZE)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
