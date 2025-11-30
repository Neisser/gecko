import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';

import type { Application } from 'express';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import activitiesRouter from './routes/activities';
import contractsRouter from './routes/contracts';
import clientsRouter from './routes/clients';
import workersRouter from './routes/workers';
import invoicesRouter from './routes/invoices';
import dashboardRouter from './routes/dashboard';

dotenv.config();

const app: Application = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/workers', workersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/dashboard', dashboardRouter);

export default app;