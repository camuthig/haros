import validate from 'validate.js';


export class StatusError extends Error {
  constructor (msg, status) {
    super(msg);
    this.status = status;
  }
}

export class ValidationError extends StatusError {
  constructor (msg) {
    super(msg, 400);
  }
}

export class NotFoundError extends StatusError {
  constructor (msg) {
    super(msg, 404);
  }
}

// TODO Need to actually determine how I want the errors to work, structure-wise
export class CollectionError extends StatusError {
  constructor (msg, errors) {
    super(msg, 500);

    if (!validate.isArray(errors)) {
      errors = [errors];
    }

    for (var err of errors) {
      if (!(err instanceof StatusError)) {
        throw new Error('errors can only contain StatusError types');
      }
    }

    this.status = errors[0].status;
    this.errors = errors;
  }
}