/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

"use strict";

var debug = require("debug")("express:router:route");
var Layer = require("./layer");
var methods = require("methods");
const { CallbackTypeError } = require("../errors/CallbackTypeError");

/**
 * Module variables.
 * @private
 */

var slice = Array.prototype.slice;
var toString = Object.prototype.toString;

/**
 * Initialize `Route` with the given `path`,
 *
 * @param {String} path
 * @public
 */

class Route {
  constructor(path) {
    debug("new %o", path);

    this.stack = []; // hold routes layers
    this.path = path; // base path for the route
    this.methods = {};

    Object.preventExtensions(this);
  }

  /**
   * Determine if the route handles a given method.
   */
  _handles_method(method) {
    if (this.methods._all) {
      return true;
    }

    // normalize name
    var name = typeof method === "string" ? method.toLowerCase() : method;

    if (name === "head" && !this.methods["head"]) {
      name = "get";
    }

    return Boolean(this.methods[name]);
  }

  /**
   * @return {Array} supported HTTP methods
   */
  _options() {
    var methods = Object.keys(this.methods);

    // append automatic head
    if (this.methods.get && !this.methods.head) {
      methods.push("head");
    }

    for (var i = 0; i < methods.length; i++) {
      // make upper case
      methods[i] = methods[i].toUpperCase();
    }

    return methods;
  }

  all(...args) {
    const handlers = args.flat(Infinity);

    for (const handle of handlers) {
      if (typeof handle !== "function") {
        throw new CallbackTypeError(handle);
      }

      const layer = new Layer("/", {}, handle);
      layer.method = undefined;

      this.methods._all = true;
      this.stack.push(layer);
    }

    return this;
  }

  // dispatch(req, res, done) {
  //   const dispatcher = new Dispatcher(this.stack, this.methods);

  //   dispatcher.dispatch(req, res, done);
  // }

  #getMethod(req) {
    const isMethodString = typeof req.method === "string";

    const method = isMethodString // normalize name
      ? req.method.toLowerCase()
      : req.method;

    if (method === "head" && !this.methods["head"]) {
      return "get";
    }

    return method;
  }

  dispatch(req, res, done) {
    var idx = 0;
    var stack = this.stack;
    var sync = 0;

    if (stack.length === 0) return done();

    const method = this.#getMethod(req);

    next();

    function next(err) {
      // signal to exit route
      if (err && err === "route") return done();

      // signal to exit router
      if (err && err === "router") return done(err);

      // max sync stack
      if (++sync > 100) return setImmediate(next, err);

      const layer = stack[idx++];

      // end of layers
      if (!layer) return done(err);

      if (layer.method && layer.method !== method) {
        next(err);
      } else if (err) {
        layer.handle_error(err, req, res, next);
      } else {
        layer.handle_request(req, res, next);
      }

      sync = 0;
    }

    req.route = this;
  }
}

// class Dispatcher {
//   constructor(stack, methods) {
//     this.stack = stack;
//     this.methods = methods;

//     this.index = 0;
//     this.sync = 0;

//     Object.preventExtensions(this);
//   }

//   #getMethod(req) {
//     const isMethodString = typeof req.method === "string";

//     const method = isMethodString // normalize name
//       ? req.method.toLowerCase()
//       : req.method;

//     if (method === "head" && !this.methods["head"]) {
//       return "get";
//     }

//     return method;
//   }

//   dispatch(req, res, done) {
//     if (this.stack.length === 0) return done();

//     this.next();
//   }

//   next(err) {
//     // signal to exit route
//     if (err && err === "route") return done();

//     // signal to exit router
//     if (err && err === "router") return done(err);

//     // max sync stack
//     if (++this.sync > 100) return setImmediate(this.next, err);

//     const currentLayer = this.stack[this.index++];
//     const currentMethod = this.#getMethod(req);
//     const layerMethod = currentLayer.method;

//     if (layerMethod && layerMethod !== currentMethod) {
//       this.next(err);
//     } else if (err) {
//       currentLayer.handle_error(err, req, res, this.next);
//     } else {
//       currentLayer.handle_request(req, res, this.next);
//     }

//     this.sync = 0;
//   }
// }

methods.forEach(function (method) {
  Route.prototype[method] = function (...args) {
    var handles = args.flat(Infinity);

    for (var i = 0; i < handles.length; i++) {
      var handle = handles[i];

      if (typeof handle !== "function") {
        var type = toString.call(handle);
        var msg =
          "Route." +
          method +
          "() requires a callback function but got a " +
          type;
        throw new Error(msg);
      }

      debug("%s %o", method, this.path);

      var layer = new Layer("/", {}, handle);
      layer.method = method;

      this.methods[method] = true;
      this.stack.push(layer);
    }

    return this;
  };
});

/**
 * Module exports.
 * @public
 */

module.exports = Route;
