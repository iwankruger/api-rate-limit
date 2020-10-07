import 'reflect-metadata';
import { RequestHandler } from 'express';
import { MetadataKeys } from './MetadataKeys';


export function use(middleware: RequestHandler): any {
    return (target: any, key: string, desc: PropertyDecorator) => {
        const middlewareArray = Reflect.getMetadata(MetadataKeys.middleware, target, key) || [];
        Reflect.defineMetadata(MetadataKeys.middleware, [...middlewareArray, middleware], target, key);
    };
}


