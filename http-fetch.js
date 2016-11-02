/**
 * Created by aweiu on 16/10/28.
 */
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fetch = require('./fetch');

var jsonp = require('./jsonp');

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
function onResponse(request, responseData, resolve) {
  var response = request;
  response.data = tryToJson(responseData);
  var next = function next() {
    var rs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : response;

    resolve(rs);
    if (typeof httpFetch.cache === 'function' && httpFetch.cache(response.data)) {
      try {
        window.localStorage.setItem(url, JSON.stringify(responseData));
      } catch (e) {
        console.warn('can not cache this responseData');
        console.log(responseData);
      }
    }
  };
  if (checkOption(request.options, 'hookResponse') && typeof httpFetch.onResponse === 'function') httpFetch.onResponse(response, next);else next();
}
function request(request, resolve, reject) {
  request.options = request.options || {
    errMode: 0,
    hookRequest: true,
    hookResponse: true,
    loading: true
  };
  var next = function next(resolveData) {
    if (resolveData !== undefined) return resolve(resolveData);
    if (checkOption(request.options, 'loading')) var loadingTimer = showLoading();
    var responseArgs = [request, typeof httpFetch.cache === 'function' ? window.localStorage.getItem(request.url) : false, resolve];
    if (responseArgs[1]) return onResponse.apply(null, responseArgs);
    var requestMethod = fetch[request.method] || jsonp;
    requestMethod(request.url, request.body).then(function (data) {
      hideLoading(loadingTimer);
      // 防止误关闭
      loadingTimer = undefined;
      responseArgs[1] = data;
      onResponse.apply(null, responseArgs);
    }).catch(function (e) {
      hideLoading(loadingTimer);
      if (e.type !== 'httpFetchError') throw e;
      e.data = tryToJson(e.data);
      if (request.options.errMode === 1 || request.options.errMode === 2) reject(e);
      if (request.options.errMode !== 1) {
        if (typeof httpFetch.onError === 'function') httpFetch.onError(e);else throw e;
      }
    });
  };
  if (checkOption(request.options, 'hookRequest') && typeof httpFetch.onRequest === 'function') httpFetch.onRequest(request, next);else next();
}
function showLoading() {
  if (httpFetch.hasOwnProperty('loading') && typeof httpFetch.loading.show === 'function') {
    return setTimeout(function () {
      httpFetch.loading.show();
    }, 600);
  }
}
function hideLoading(timer) {
  if (timer !== undefined && httpFetch.hasOwnProperty('loading') && typeof httpFetch.loading.hide === 'function') {
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
        request({
          url: url,
          body: body,
          method: method,
          options: options
        }, resolve, reject);
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
/**
 * @param {Object} json
 */
httpFetch.jsonToUrlParams = function (json) {
  var urlParams = '';
  for (var param in json) {
    if (!json.hasOwnProperty(param)) break;
    var tmp = json[param];
    urlParams += param + '=' + ((typeof tmp === 'undefined' ? 'undefined' : _typeof(tmp)) === 'object' ? JSON.stringify(tmp) : tmp) + '&';
  }
  return urlParams.substr(0, urlParams.length - 1);
};
module.exports = httpFetch;
