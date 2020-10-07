import * as bodyParser from 'body-parser';
import express, { NextFunction, Request, Response } from 'express';
import { AppRouter } from './AppRouter';
import './controllers/User';
import { Redis } from './Redis';

Redis.getInstance().on('connect', function() {
    console.log('Connected to Redis');
});

const app = express();

app.use(bodyParser.json());
app.use(AppRouter.getInstance());


app.listen(5000, () => console.log(`Version 1.0.0 App listening on localhost:5000`));
