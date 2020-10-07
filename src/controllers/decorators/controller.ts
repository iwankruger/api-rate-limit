import 'reflect-metadata';
import { AppRouter } from '../../AppRouter';
import { Methods } from './Methods';
import { MetadataKeys } from './MetadataKeys';
import { RequestHandler, NextFunction, Request, Response } from 'express';


function bodyValidators(keys: { [key: string]: ((value: any) => { result: boolean, message: string | null })[] }): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.body) return res.status(422).send('Invalid request');

        const errorMessages: { [key: string]: string[] } = {};
        // loop through parameter to check
        for (const parameter of Object.keys(keys)) {
            // execute each supplied evaluator on specific parameter
            for (const evaluator of keys[parameter]) {
                const validate = evaluator(req.body[parameter]);
                if (!validate.result && validate.message) {
                    if (!errorMessages[parameter]) errorMessages[parameter] = [];
                    errorMessages[parameter].push(validate.message);
                }
            }
        }

        if (Object.keys(errorMessages).length > 0) {
            return res.status(422).send(errorMessages);
        }
        
        next();
    }
}


export function controller(routePrefix: string): any {
    return (target: () => void) => {
        const router = AppRouter.getInstance();
        for (const key of Object.getOwnPropertyNames(target.prototype)) {
            if (key === 'constructor') continue;
            const routeHandler = target.prototype[key];
            const path = Reflect.getMetadata(MetadataKeys.path, target.prototype, key);
            const method: Methods = Reflect.getMetadata(MetadataKeys.method, target.prototype, key);
            const middlewareArray = Reflect.getMetadata(MetadataKeys.middleware, target.prototype, key) || [];
            const requiredBodyProps = Reflect.getMetadata(MetadataKeys.validator, target.prototype, key) || [];
            const validator = bodyValidators(requiredBodyProps);
            if (path) router[method](`${routePrefix}${path}`, ...middlewareArray, validator, routeHandler);
        }
    };
}