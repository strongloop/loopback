/*
 * This is an internal file that should not be used outside of loopback.
 * All exported entities can be accessed via the `loopback` object.
 * @private
 */

var runtime = exports;

/**
 * True if running in a browser environment; false otherwise.
 * @header loopback.isBrowser
 */

runtime.isBrowser = typeof window !== 'undefined';

/**
 * True if running in a server environment; false otherwise.
 * @header loopback.isServer
 */

runtime.isServer = !runtime.isBrowser;
