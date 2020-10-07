import { NextFunction, Request, Response } from 'express';
import { Redis } from './Redis';
import moment, { Moment } from 'moment';
import requestLimitConfig from './requestLimitConfig.json'
const env = process.env.NODE_ENV || 'development';
const limitConfig: {limitWindowSeconds: number, LimitWindowRequestCount: number} = requestLimitConfig[env as keyof typeof requestLimitConfig];

// 86400 seconds = 24*60*60 = 24 hours
const LIMIT_WINDOW_SECONDS = limitConfig.limitWindowSeconds;
const LIMIT_WINDOW_REQUEST_COUNT = limitConfig.LimitWindowRequestCount;

export interface tokenStatusInterface {
    valid: boolean;
    requestCount: number;
    requestLimit: number;
    requestLimitSeconds: number;
    requestsInWindow?: [{timeStamp: string}];
}


export const limitStatus = async(token: string, timeStamp: Moment): Promise<tokenStatusInterface> => {
    return new Promise( (resolve, reject) => {
        Redis.getInstance().get(token, (error, tokenData) => {
            let requestCount = 0;
            let valid = true;
            const requestLimit = LIMIT_WINDOW_REQUEST_COUNT;
            const requestLimitSeconds = LIMIT_WINDOW_SECONDS;
        
            if (error) return reject(error);

            // no records found
            if (!tokenData) return resolve({ valid, requestCount, requestLimit, requestLimitSeconds });

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
            if (requestsWithinWindowCount >= LIMIT_WINDOW_REQUEST_COUNT) valid = false;

            return resolve({ valid, requestCount: requestsWithinWindowCount, requestLimit, requestLimitSeconds, requestsInWindow: requestsWithinWindow });
        });
    });
}

export const requestLimit = async (req: Request, res: Response, next: NextFunction) => {
  
    // check header or url parameters or post parameters for token
    const token = req.body.api_key || req.query.api_key || req.headers.api_key;

    if (!token) return res.status(401).send('Unauthorized');

    try {
        const timeStamp = moment.utc();
        // get limit status for token
        const tokenStatus = await limitStatus(token, timeStamp);

        // check if request limit is exceeded
        if (!tokenStatus.valid) return res.status(429).send('Request count exceeded');

        // add first request for this token
        if (tokenStatus.requestCount === 0) {
            Redis.getInstance().set(token, JSON.stringify([{timeStamp}]));
            return next();
        }

        // request count was not exceeded
        // there are multiple requests for this token in the time window
        // get request timestamps stored
        const requestTimestamps: {}[] = (tokenStatus.requestsInWindow && Array.isArray(tokenStatus.requestsInWindow))? tokenStatus.requestsInWindow: [];
        
        // add timestamp for this token
        requestTimestamps.push({timeStamp});
        Redis.getInstance().set(token, JSON.stringify(requestTimestamps));

        return next();

    } catch (error) {
        return res.status(500).send(error.message);
    }
};