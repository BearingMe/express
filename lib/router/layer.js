/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */
"use strict";

const pathRegexp = require("path-to-regexp");
const debug = require("debug")("express:router:layer");

class Layer {
  route = undefined;
  params = undefined;
  path = undefined;
  method = undefined;
  keys = [];

  constructor(path, options, fn) {
    debug("new %o", path);

    this.opts = options || {};
    this.handle = fn;
    this.regexp = Layer.parsePath(path, this.keys, this.opts);

    Object.preventExtensions(this);
  }

  /**
   * Converts path expressions into regular expressions
   * and returns an array of keys.
   *
   * @param {String|RegExp|Array} path - The path expression to convert.
   * @param {Array} keys - An array to store keys extracted from the path.
   * @param {Object} options - Additional options for the conversion.
   * @returns {RegExp} The resulting regular expression.
   */
  static parsePath(path, keys, options) {
    const regexp = pathRegexp(path, keys, options);

    regexp.fast_star = path === "*";
    regexp.fast_slash = path === "/" && options.end === false;

    return regexp;
  }

  /**
   * Decode param value.
   *
   * @param {string} val
   * @return {string}
   */
  static decodeParam(val) {
    if (typeof val !== "string" || val.length === 0) {
      return val;
    }

    try {
      return decodeURIComponent(val);
    } catch (err) {
      if (err instanceof URIError) {
        err.message = "Failed to decode param '" + val + "'";
        err.status = err.statusCode = 400;
      }

      throw err;
    }
  }

  /**
   * Handle the request for the layer.
   *
   * @param {Request} req
   * @param {Response} res
   * @param {function} next
   */
  handle_request(req, res, next) {
    const fn = this.handle;
    const len = this.handle.length;

    if (len > 3) return next();

    try {
      fn(req, res, next);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handle the error for the layer.
   *
   * @param {Error} error
   * @param {Request} req
   * @param {Response} res
   * @param {function} next
   */
  handle_error(error, req, res, next) {
    const fn = this.handle;
    const len = fn.length;

    if (len !== 4) return next(error);

    try {
      fn(error, req, res, next);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Check if this route matches `path`, if so
   * populate `.params`.
   *
   * @param {String} path
   * @return {Boolean}
   * @api private
   */
  match(path) {
    if (!path) return false;

    // fast path non-ending match for / (any path matches)
    if (this.regexp.fast_slash) {
      this.params = {};
      this.path = "";
      return true;
    }

    // fast path for * (everything matched in a param)
    if (this.regexp.fast_star) {
      this.params = { 0: Layer.decodeParam(path) };
      this.path = path;
      return true;
    }

    const match = this.regexp.exec(path);

    if (!match) {
      this.params = undefined;
      this.path = undefined;
      return false;
    }

    // store values
    this.params = {};
    this.path = match[0];

    var keys = this.keys;
    var params = this.params;

    let index = 1;
    for (const matchValue of match.slice(1)) {
      const key = keys[index - 1];
      const prop = key.name;
      const val = Layer.decodeParam(matchValue);

      if (val !== undefined || !(prop in params)) {
        params[prop] = val;
      }

      index++;
    }

    return true;
  }
}

module.exports = Layer;
