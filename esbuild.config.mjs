import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const vendor = path.join(dir, 'vendor');

await esbuild.build({
  entryPoints: [
    path.join(dir, 'js/main.js'),
    path.join(dir, 'js/ui.js'),
  ],
  bundle: true,
  outdir: path.join(dir, 'dist'),
  format: 'iife',
  plugins: [{
    name: 'importmap',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, () => ({ path: path.join(vendor, 'three/three.module.js') }));
      build.onResolve({ filter: /^three\/addons\// }, args => ({ path: path.join(vendor, 'three/addons', args.path.replace('three/addons/', '')) }));
      build.onResolve({ filter: /^lenis$/ }, () => ({ path: path.join(vendor, 'lenis.mjs') }));
    }
  }]
});
console.log('Build complete');
