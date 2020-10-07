import { Router, NextFunction, Request, Response } from 'express';
import { get, post, patch, del, controller, use } from './decorators';
import * as requestLimiter from '../requestLimiter';
import { User as UserService } from '../services/User';


@controller('/api')
class User {

    @get('/users')
    @use(requestLimiter.requestLimit)
    getUsers(req: Request, res: Response, next: NextFunction): void {
        res.send('hello world!!!');
    }

    @get('/users/status')
    getUsersStatus(req: Request, res: Response, next: NextFunction) {
        if (!req.query || !req.query.api_key) return res.status(400).send('API key missing');

        UserService.tokenStatus(String(req.query.api_key)).then((tokenData) => {
            res.send({
                requestCount: tokenData.requestCount, 
                requestLimit: tokenData.requestLimit,
                requestLimitSeconds: tokenData.requestLimitSeconds
            });
        }).catch((error) => {
            return res.status(500).send(error.message);
        });
    }

}
