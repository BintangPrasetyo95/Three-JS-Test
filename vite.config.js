import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/Three-JS-Test/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tesseract: resolve(__dirname, 'tesseract.html'),
        rocket: resolve(__dirname, 'rocket.html'),
        car: resolve(__dirname, 'car.html'),
        hatchback: resolve(__dirname, 'hatchback.html'),
        backrooms: resolve(__dirname, 'backrooms.html'),
      },
    },
  },
});
