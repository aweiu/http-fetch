/**
 * Created by aweiu on 16/10/28.
 */
'use strict';

var httpFetch = {};
function setOption(option, name, val) {
  option[name] = option[name] || val;
}
var _arr = ['get', 'head', 'delete', 'post', 'put', 'patch'];

var _loop = function _loop() {
  var method = _arr[_i];
  httpFetch[method] = function (url, body) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var fetchOptions = JSON.parse(JSON.stringify(options));
    fetchOptions.method = method;
    fetchOptions.body = body;
    setOption(fetchOptions, 'credentials', 'same-origin');
    setOption(fetchOptions, 'headers', {});
    setOption(fetchOptions.headers, 'Cache-Control', 'no-cache');
    setOption(fetchOptions.headers, 'X-Requested-With', 'XMLHttpRequest');
    if (!fetchOptions.headers.hasOwnProperty('Content-Type') && typeof data === 'string') fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    return window.fetch(url, fetchOptions).then(function (rs) {
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
