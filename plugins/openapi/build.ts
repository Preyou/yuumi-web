import Bun from 'bun'

Bun.build({
  entrypoints: ['./src/cli.ts', './src/index.ts', './src/vite.ts'],
  minify: true,
  naming: '[dir]/[name].js',
  outdir: './dist',
  splitting: true,
  target: 'node',
})
