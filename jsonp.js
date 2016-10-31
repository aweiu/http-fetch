'use strict';

/**
 * Created by aweiu on 16/10/28.
 */
function clear(callback, script) {
  delete window[callback];
  document.body.removeChild(script);
}

module.exports = function (url) {
  return new Promise(function (resolve, reject) {
    var callback = '_jsonp' + Math.random().toString(36).substr(2);
    var script = document.createElement('script');
    script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'callback=' + callback;
    script.onerror = function () {
      var error = Error('httpFetchError: Failed to fetch jsonp');
      error.status = 'unknown';
      error.type = 'httpFetchError';
      reject(error);
      clear(callback, script);
    };
    script.onload = function () {
      clear(callback, script);
    };
    document.body.appendChild(script);
    window[callback] = function (rs) {
      return resolve(rs);
    };
  });
};