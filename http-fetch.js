/**
 * Created by aweiu on 16/10/28.
 */
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _fetch = require('./fetch');

var jsonp = require('./jsonp');

var resource = {
  cache: {},
  getCacheOption: function getCacheOption(options) {
    return options.hasOwnProperty('cache') ? options.cache : httpFetch.cache;
  },
  fetch: function fetch(request) {
    return (_fetch[request.method] || jsonp)(request.url, request.body, request.options.requestOptions || httpFetch.requestOptions);
  },
  setCache: function setCache(request, eigenvalue) {
    var promise = this.fetch(request);
    this.cache[eigenvalue] = [promise, new Date()];
    return promise;
  },
  getCache: function getCache(eigenvalue, cacheOption) {
    var cache = this.cache[eigenvalue];
    if (cache && (cacheOption === true || new Date() - cache[1] < cacheOption)) return cache[0];
  },
  get: function get(request) {
    var cacheOption = this.getCacheOption(request.options);
    // 仅缓存如下三种请求
    if (cacheOption && ['get', 'head', 'jsonp'].indexOf(request.method) !== -1) {
      var eigenvalue = 'url=' + request.url + '&method=' + request.method;
      var cacheResource = this.getCache(eigenvalue, cacheOption);
      return cacheResource ? cacheResource : this.setCache(request, eigenvalue);
    } else return this.fetch(request);
  }
};
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
  };
  if (checkOption(request.options, 'hookResponse') && typeof httpFetch.onResponse === 'function') httpFetch.onResponse(response, next);else next();
}
function request(request, resolve, reject) {
  var next = function next(resolveData) {
    if (resolveData !== undefined) return resolve(resolveData);
    if (checkOption(request.options, 'loading')) var loadingTimer = showLoading();
    resource.get(request).then(function (data) {
      hideLoading(loadingTimer);
      // 防止误关闭
      loadingTimer = undefined;
      onResponse(request, data, resolve);
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
          options: options || {}
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
