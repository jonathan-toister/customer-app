import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { customersRouter } from './customers.routes.js';
import { EMPTY_SEED } from './customers.store.js';
import { sendError } from './errors.js';

const PORT = Number(process.env.PORT ?? 3000);
const API_DELAY_MS = Number(process.env.API_DELAY_MS ?? 400);
const API_FAIL_RATE = Number(process.env.API_FAIL_RATE ?? 0);

// Fake latency and random failures, so the client's loading, request-cancelling and
// error/retry states can be seen locally. See "Dev knobs" in docs/API.md.
const devKnobs: RequestHandler = (_req, res, next) => {
  setTimeout(() => {
    if (Math.random() < API_FAIL_RATE) {
      return sendError(res, 500, 'SIMULATED_FAILURE', 'Simulated failure (API_FAIL_RATE)');
    }
    next();
  }, API_DELAY_MS);
};

const unknownApiRoute: RequestHandler = (_req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Unknown API route');
};

function isJsonParseError(err: unknown): boolean {
  // express.json() tags the errors it throws for a malformed body with this type.
  return typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed';
}

// Express recognises an error handler by its four parameters, so _next must stay even though it's unused.
const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (isJsonParseError(err)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Request body is not valid JSON');
  }
  console.error(err);
  sendError(res, 500, 'INTERNAL', 'Something went wrong on the server');
};

const app = express();
app.use(express.json());
app.use('/api', devKnobs);
app.use('/api/customers', customersRouter);
app.use('/api', unknownApiRoute);
app.use(errorHandler);

app.listen(PORT, () => {
  const seed = EMPTY_SEED ? 'empty' : 'demo';
  console.log(`API on http://localhost:${PORT} (delay ${API_DELAY_MS}ms, fail rate ${API_FAIL_RATE}, seed ${seed})`);
});
