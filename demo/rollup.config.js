import svelte from 'rollup-plugin-svelte'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import css from 'rollup-plugin-css-only'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import nodeGlobals from 'rollup-plugin-node-globals'
import builtins from 'rollup-plugin-node-builtins'
import alias from '@rollup/plugin-alias'
import json from '@rollup/plugin-json'

const production = !process.env.ROLLUP_WATCH

function serve () {
  let server

  function toExit () {
    if (server) server.kill(0)
  }

  return {
    writeBundle () {
      if (server) return
      server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      })

      process.on('SIGTERM', toExit)
      process.on('exit', toExit)
    }
  }
}

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/hyperbee/build/bundle.js'
  },
  plugins: [
    json(),
    alias({
      entries: [
        { find: 'utils', replacement: './node_modules/util/util.js' },
        { find: 'hyperswarm', replacement: 'hyperswarm-web' },
        { find: 'sodium-universal', replacement: 'sodium-javascript' }
      ]
    }),
    svelte({
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production
      }
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: 'bundle.css' }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    nodeResolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs({
      include: [/node_modules/] // require is not defined?
    }),
    nodePolyfills({ buffer: true, process: true, events: true, fs: true }),
    nodeGlobals(), // after commonjs, before builtins
    builtins(), // builtins after commonjs

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
}
