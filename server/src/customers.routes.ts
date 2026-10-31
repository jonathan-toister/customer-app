import { Router, type Response } from 'express';
import * as customersStore from './customers.store.js';
import { sendError } from './errors.js';
import { parseListQuery, validateCustomerInput, type FieldErrors } from './validation.js';

export const customersRouter = Router();

function sendNotFound(res: Response): void {
  sendError(res, 404, 'NOT_FOUND', 'Customer not found');
}

function sendValidationError(res: Response, fields: FieldErrors): void {
  sendError(res, 400, 'VALIDATION_ERROR', 'Some fields are invalid', fields);
}

function sendEmailTaken(res: Response): void {
  sendError(res, 409, 'EMAIL_TAKEN', 'A customer with this email already exists', {
    email: 'Email is already in use',
  });
}

customersRouter.get('/', (req, res) => {
  const query = parseListQuery(req.query);
  if (!query.ok) {
    return sendError(res, 400, 'BAD_REQUEST', query.message);
  }
  res.json(customersStore.list(query.value));
});

// Listed before the /:id routes so the fixed paths are easy to spot when reading top to bottom.
customersRouter.post('/reset', (_req, res) => {
  customersStore.reset();
  res.status(204).end();
});

customersRouter.get('/:id', (req, res) => {
  const customer = customersStore.getById(req.params.id);
  if (!customer) {
    return sendNotFound(res);
  }
  res.json(customer);
});

customersRouter.post('/', (req, res) => {
  const result = validateCustomerInput(req.body);
  if (!result.ok) {
    return sendValidationError(res, result.fields);
  }
  if (customersStore.emailTaken(result.value.email)) {
    return sendEmailTaken(res);
  }
  res.status(201).json(customersStore.create(result.value));
});

customersRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  if (!customersStore.getById(id)) {
    return sendNotFound(res);
  }
  const result = validateCustomerInput(req.body);
  if (!result.ok) {
    return sendValidationError(res, result.fields);
  }
  // Passing the id lets a customer keep their own email; only *another* customer's email conflicts.
  if (customersStore.emailTaken(result.value.email, id)) {
    return sendEmailTaken(res);
  }
  res.json(customersStore.update(id, result.value));
});
