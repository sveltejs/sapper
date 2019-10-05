import * as fs from 'fs'

export default function validate_bundler(bundler?: 'rollup' | 'webpack') {
  if (!bundler) {
    // SWYX: default to rollup, because @ssgjs/sapper now ships a fallback rollup config
    bundler = fs.existsSync('webpack.config.js') ? 'webpack' : 'rollup'
  }

  if (bundler !== 'rollup' && bundler !== 'webpack') {
    throw new Error(`'${bundler}' is not a valid option for --bundler — must be either 'rollup' or 'webpack'`)
  }

  return bundler
}
