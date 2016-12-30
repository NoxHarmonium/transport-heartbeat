import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

const nodeResolveConfig = {
  browser: true,
};

export default {
  entry: 'src/main.js',
  format: 'iife',
  plugins: [ json(), babel() ],
  dest: 'html/js/bundle.js',
  exports: 'none',
  globals: {
    Leaflet: 'L',
  }
};