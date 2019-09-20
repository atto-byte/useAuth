
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./use-auth0.cjs.production.min.js')
} else {
  module.exports = require('./use-auth0.cjs.development.js')
}
