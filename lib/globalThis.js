/* global globalThis */

var cachedGlobal;

module.exports = function global () {
  if (typeof cachedGlobal !== 'undefined') {
    return cachedGlobal;
  }

  try {
    cachedGlobal = globalThis;
  } catch (e) {
    if (!(e instanceof ReferenceError)) {
      throw e;
    }
  }
  if (typeof cachedGlobal !== 'undefined') {
    return cachedGlobal;
  }

  try {
    cachedGlobal = self;
  } catch (e) {
    if (!(e instanceof ReferenceError)) {
      throw e;
    }
  }
  if (typeof cachedGlobal !== 'undefined') {
    return cachedGlobal;
  }

  try {
    cachedGlobal = window;
  } catch (e) {
    if (!(e instanceof ReferenceError)) {
      throw e;
    }
  }
  if (typeof cachedGlobal !== 'undefined') {
    return cachedGlobal;
  }

  try {
    cachedGlobal = global;
  } catch (e) {
    if (!(e instanceof ReferenceError)) {
      throw e;
    }
  }
  if (typeof cachedGlobal !== 'undefined') {
    return cachedGlobal;
  }

  return this;
};
