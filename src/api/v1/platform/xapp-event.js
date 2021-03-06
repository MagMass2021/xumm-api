const log = require('~src/handler/log')('app:xapp:event')
const payloadPostHandler = require('~src/api/v1/platform/payload-post')
const xappPush = require('~src/api/v1/platform/xapp-push')

module.exports = async (req, res) => {
  try {
    const appXapp = await req.db(`
      SELECT
        application_xapp_identifier as xapp
      FROM
        applications
      WHERE
        application_id = :appId
    `, {
      appId: req.__auth.application.id
    })
    const xAppId = Array.isArray(appXapp) && appXapp.length > 0 ? appXapp[0].xapp : null

    if (xAppId === null) {
      const e = new Error('No xApp ID for calling application')
      e.code = 403
      throw(e)
    }

    const originalBody = Object.assign({}, req.body)

    Object.assign(req.body, {
      txjson: {
        TransactionType: 'SignIn',
        xappIdentifier: xAppId,
        xappTitle: (req?.body?.subtitle || req?.body?.data.subtitle) || undefined,
        data: req?.body?.data || {},
        account: req?.body?.data?.account || undefined
      },
      xappEvent: true
    })

    const handlerResult = await payloadPostHandler(req, res)
    // UUID can be null if payload-post breaks if no push token found
    // REF:#XAPP_BREAK_INVALID_PUSH_TOKEN
    log(handlerResult?.uuid)

    req.body = originalBody
    Object.assign(req.body, {payload: handlerResult?.uuid})
    if (typeof req.body.data !== 'undefined') {
      Object.assign(req.body.data, {payload: handlerResult?.uuid})
    }

    return xappPush(req, res, handlerResult?.uuid)
  } catch (e) {
    res.handleError(e)
  }
}
