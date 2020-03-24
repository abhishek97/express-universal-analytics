/**
 * Created by championswimmer on 05/01/17.
 */
import { Request, RequestHandler, NextFunction, Response } from 'express'
import * as ua from 'universal-analytics'
import { Visitor } from 'universal-analytics'
declare module 'express' {
  export interface Request {
    visitor: Visitor
  }
}

declare module 'universal-analytics' {
  export interface Visitor {
    setUid (uid?: string): void
  }
}

export interface ReqToUserId { (req: Request): string }

function ExpressGA(uaCode: string, cookieName?: string, reqToUserId?: ReqToUserId): RequestHandler {
  let middlewareOpts = { cookieName: cookieName || '_ga' }
  let middleware = ua.middleware(uaCode, middlewareOpts)

  async function middlewareWrapper(req: Request, res: Response, next: NextFunction) {
    // call the universal-analytic lib's middleware
    middleware(req, res, () => { // our pre-next wrapper

      req.visitor.setUid = function (uid?: string) {
        if (req.session) req.session.gauid = uid
      }
      
      if (!req.headers['x-forwarded-for']) {
        req.headers['x-forwarded-for'] = '0.0.0.0'
      }
      if (reqToUserId && typeof reqToUserId === 'function') {
        // if reqToUserId function exists use it to generate uid
        const userId = reqToUserId(req)
        if (userId) req.visitor.set('uid', userId)
      } else {
        // else if it was in session pick it
        req.visitor.set('uid', (req.session && req.session.gauid))
      }

      req.visitor.set('dh', req.protocol + '://' + req.get('host'))
      if (req.query['utm_source']) req.visitor.set('cs', req.query['utm_source'])
      if (req.query['utm_medium']) req.visitor.set('cm', req.query['utm_medium'])
      if (req.query['utm_campaign']) req.visitor.set('cn', req.query['utm_campaign'])

      next() // actually call next now


      // pageview in side effects
      req.visitor.pageview({
        dp: req.originalUrl,
        dr: req.get('Referer'),
        ua: req.headers['user-agent'],
        uip: (req.connection.remoteAddress
          || req.socket.remoteAddress
          || req.connection.remoteAddress
          || (<string>req.headers['x-forwarded-for']).split(',').pop())
      }).send()
    })

  }

  return middlewareWrapper
}

module.exports = ExpressGA
export default ExpressGA