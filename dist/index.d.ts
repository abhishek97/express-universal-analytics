/**
 * Created by championswimmer on 05/01/17.
 */
import { Request, RequestHandler } from 'express';
import { Visitor } from 'universal-analytics';
declare module 'express' {
    interface Request {
        visitor: Visitor;
    }
}
declare module 'universal-analytics' {
    interface Visitor {
        setUid(uid: string): void;
    }
}
export interface ReqToUserId {
    (req: Request): string;
}
declare function ExpressGA(uaCode: string, cookieName?: string, reqToUserId?: ReqToUserId): RequestHandler;
export default ExpressGA;
