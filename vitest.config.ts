import { defineConfig } from 'vitest/config';

export default defineConfig({
  // resolve: {
  //   alias: {
  //     '@': __dirname,
  //   },
  // },
  test: {
    // globals: true,
    environment: 'node',
  },
});
