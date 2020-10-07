import { Router, NextFunction, Request, Response } from 'express';
import { get, post, patch, del, controller, use } from './decorators';
import * as verify from '../verify';


@controller('/api')
class User {

    @get('/users')
    @use(verify.requestLimiter)
    getUsers(req: Request, res: Response, next: NextFunction): void {
        res.send('hello world!!!');
    }

}
