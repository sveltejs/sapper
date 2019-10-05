import sirv from 'sirv'
import polka from 'polka'
import compression from 'compression'
import * as sapper from '@sapper/server'
import fs from 'fs'
const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === 'development'

polka() // You can also use Express
  .use(
    compression({ threshold: 0 }),
    (req, res, next) => {
      if (fs.existsSync('static')) {
        // console.log(`serving 'static' folder...`)
        sirv('static', { dev })(req, res, next)
      } else {
        // console.log(`no 'static' folder found, not serving it..`)
        next()
      }
    },
    sapper.middleware(),
  )
  .listen(PORT, (err) => {
    if (err) console.log('error', err)
  })
