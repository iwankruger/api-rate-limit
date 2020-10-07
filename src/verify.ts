import { NextFunction, Request, Response } from 'express';
import { Redis } from './Redis';
import moment from 'moment';
import requestLimitConfig from './requestLimitConfig.json'
const env = process.env.NODE_ENV || 'development';
const limitConfig: {limitWindowSeconds: number, LimitWindowRequestCount: number} = requestLimitConfig[env as keyof typeof requestLimitConfig];

// 86400 seconds = 24*60*60 = 24 hours
const LIMIT_WINDOW_SECONDS = limitConfig.limitWindowSeconds;
const LIMIT_WINDOW_REQUEST_COUNT = limitConfig.LimitWindowRequestCount;

interface RequestWithKey extends Request {
    decoded?: object | undefined
}

export const requestLimiter = (req: Request, res: Response, next: NextFunction) => {
  
    // check header or url parameters or post parameters for token
    const token = req.body.api_key || req.query.api_key || req.headers.api_key;

    if (!token) return res.status(401).send('Unauthorized');

    // check redis if request should be allowed
    Redis.getInstance().get(token, (error, tokenData) => {
        const timeStamp = moment.utc();
        
        // todo if error 

        // no records found
        if (!tokenData) {
            let tokenDataNew = [];
            Redis.getInstance().set(token, JSON.stringify([{timeStamp}]));
            return next();
        }

        // records found
        let tokenDataDecoded = JSON.parse(tokenData);

        // check data there is token data
        if (!tokenDataDecoded || !Array.isArray(tokenDataDecoded)) tokenDataDecoded = [];

        // get begin timestamp of our sliding window
        const timeStampWindowBegin = moment(timeStamp).subtract(LIMIT_WINDOW_SECONDS, 'seconds');

        // get all timestamps that are within our window
        const requestsWithinWindow = tokenDataDecoded.filter((entry: {timeStamp: string}) => {
            return moment(entry.timeStamp) > timeStampWindowBegin;
        });

        // count number of requests made within window
        const requestsWithinWindowCount = requestsWithinWindow.length;

        // check if request count is exceeded
        if (requestsWithinWindowCount >= LIMIT_WINDOW_REQUEST_COUNT) {
            return res.status(429).send('Request count exceeded');
        }

        // request count was not exceeded
        // add request
        requestsWithinWindow.push({timeStamp});
        Redis.getInstance().set(token, JSON.stringify(requestsWithinWindow));

        // proceed to api
        return next();
    });
};