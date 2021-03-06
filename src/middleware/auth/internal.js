const log = require('~src/handler/log')('app:internal-api')

module.exports = async (expressApp, req, res, apiDetails) => {
  // log('<< API: INTERNAL MIDDLEWARE >>')
  if (req.ipTrusted || !apiDetails.auth) {
    // log(req.headers.authorization)
    return
  }
  throw new Error('Nope.')
}
