"use strict";
/**
 * Custom Error Class: CallbackTypeError
 *
 * This custom error class is used to represent an error when a callback function
 * is expected, but a different type of object is provided. It extends the built-in
 * TypeError class for consistency.
 *
 * @class CallbackTypeError
 * @extends TypeError
 * @constructor
 * @param {any} handle - The object or value that caused the error.
 */
class CallbackTypeError extends TypeError {
  /**
   * Constructor for the CallbackTypeError class.
   *
   * @constructor
   * @param {any} handle - The object or value that caused the error.
   */
  constructor(handle) {
    const type = CallbackTypeError.#getHandleType(handle);
    const msg = CallbackTypeError.#getErrorMsg(type);

    super(msg);

    // Set the name property for better error identification.
    this.name = "CallbackTypeError";
  }

  /**
   * Private method to get the type of the provided handle.
   *
   * @private
   * @param {any} handle - The object or value to determine the type of.
   * @returns {string} - A string representing the type of the handle.
   */
  static #getHandleType(handle) {
    const toString = Object.prototype.toString;
    const type = toString.call(handle);

    return type;
  }

  /**
   * Private method to generate the error message based on the handle type.
   *
   * @private
   * @param {string} type - The type of the handle.
   * @returns {string} - The error message.
   */
  static #getErrorMsg(type) {
    const base = "Route.all() requires a callback function but got a ";
    return base + type;
  }
}

// Export the CallbackTypeError class for use in other modules.
module.exports = { CallbackTypeError };
