"use strict";
/**
 * Replace removed middleware with an appropriate error message.
 */
/**
 * @class RemovedMiddlewareError
 * @extends Error
 * Represents an error thrown when attempting to access a removed middleware that is no longer bundled with Express.
 */
class RemovedMiddlewareError extends Error {
  /**
   * @param {string} middleware The name of the removed middleware.
   * @example
   * throw new RemovedMiddlewaresError('bodyParser');
   * // => Error: Most middleware (like bodyParser) is no longer bundled with Express and must be installed separately. Please see
   */
  constructor(middleware) {
    const msg = RemovedMiddlewareError.#getErrorMsg(middleware);

    super(msg);

    this.name = "RemovedMiddlewareError";
  }

  static #getErrorMsg(middleware) {
    const msg = `Most middleware (like ${middleware}) is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.`;

    return msg;
  }
}

module.exports = { RemovedMiddlewareError };
