'use strict';

/**
 * Created by aweiu on 16/10/28.
 */
var httpFetch = {};
var _arr = ['get', 'head', 'delete', 'post', 'put', 'patch'];

var _loop = function _loop() {
  var method = _arr[_i];
  httpFetch[method] = function (url, body) {
    return window.fetch(url, {
      method: method,
      body: body,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).then(function (rs) {
      return rs.text().then(function (text) {
        if (rs.ok) return text;
        var error = Error('httpFetchError:' + rs.statusText);
        error.url = url;
        error.body = body;
        error.method = method;
        error.status = rs.status;
        error.data = text;
        error.type = 'httpFetchError';
        throw error;
      });
    }).catch(function (e) {
      e.message = 'httpFetchError:' + e.message;
      e.url = url;
      e.type = 'httpFetchError';
      throw e;
    });
  };
};

for (var _i = 0; _i < _arr.length; _i++) {
  _loop();
}
module.exports = httpFetch;