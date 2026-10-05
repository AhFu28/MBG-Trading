import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // The React plugin is required for JSX in component tests. Without it the
  // transform emits classic React.createElement calls and every .jsx test dies
  // with "React is not defined".
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // .jsx included so component tests (AuthPanel) are picked up too.
    include: ['src/**/__tests__/**/*.test.{js,jsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
