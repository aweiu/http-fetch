'use strict';

var fetch = require('./fetch');

var jsonp = require('./jsonp');

/**
 * Created by aweiu on 16/10/28.
 */
function tryToJson(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data || {};
  }
}
function checkOption(options, key) {
  return !options.hasOwnProperty(key) || options[key];
}
function onResponse(response, method, url, body, resolve, options, loadingTimer) {
  if (loadingTimer !== undefined) hideLoading(loadingTimer);
  var result = {
    url: url,
    body: body,
    method: method,
    options: options,
    response: tryToJson(response)
  };
  var next = function next() {
    var rs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : result.response;

    resolve(rs);
    if (typeof httpFetch.afterResolve === 'function' && checkOption(options, 'afterResolve')) httpFetch.afterResolve(result);
    if (typeof httpFetch.cache === 'function' && httpFetch.cache(result)) window.localStorage.setItem(url, JSON.stringify(rs));
  };
  if (typeof httpFetch.beforeResolve === 'function' && checkOption(options, 'beforeResolve')) httpFetch.beforeResolve(result, next);else next();
}
function request(method, url, body, resolve, reject) {
  var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {
    errMode: 0,
    beforeResolve: true,
    afterResolve: true,
    loading: true
  };

  var responseArgs = [typeof httpFetch.cache === 'function' ? window.localStorage.getItem(url) : false, method, url, body, resolve, options, checkOption(options, 'loading') ? showLoading() : undefined];
  if (responseArgs[0]) return onResponse.apply(null, responseArgs);
  var requestMethod = fetch[method] || jsonp;
  requestMethod(url, body).then(function (rs) {
    responseArgs[0] = rs;
    onResponse.apply(null, responseArgs);
  }).catch(function (e) {
    if (e.type !== 'httpFetchError') throw e;
    e.url = url;
    e.body = body;
    e.method = method;
    e.response = tryToJson(e.response);
    if (options.errMode === 1 || options.errMode === 2) reject(e);
    if (options.errMode !== 1) {
      if (typeof httpFetch.onError === 'function') httpFetch.onError(e);else throw e;
    }
  });
}
function showLoading() {
  if (httpFetch.hasOwnProperty('loading') && typeof httpFetch.loading.show === 'function') {
    return setTimeout(function () {
      httpFetch.loading.show();
    }, 600);
  }
}
function hideLoading(timer) {
  if (httpFetch.hasOwnProperty('loading') && typeof httpFetch.loading.hide === 'function') {
    clearTimeout(timer);
    httpFetch.loading.hide();
  }
}
var httpFetch = {};
var methods = ['get', 'head', 'jsonp', 'delete', 'post', 'put', 'patch'];
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  var _loop = function _loop() {
    var method = _step.value;

    httpFetch[method] = function (url, body, options) {
      if (methods.indexOf(method) < 3) {
        options = body;
        body = null;
      }
      return new Promise(function (resolve, reject) {
        request(method, url, body, resolve, reject, options);
      });
    };
  };

  for (var _iterator = methods[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    _loop();
  }
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator.return) {
      _iterator.return();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}

module.exports = httpFetch;