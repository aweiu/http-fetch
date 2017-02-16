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
    return request.method === 'jsonp' ? jsonp(request.url) : _fetch(request.url, request.method, request.body, request.options.requestOptions || httpFetch.requestOptions);
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
function getRequestPromise(url, method, body) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  return new Promise(function (resolve, reject) {
    request({
      url: url,
      body: body,
      method: method,
      options: options
    }, resolve, reject);
  });
}
var httpFetch = {
  get: function get(url, options) {
    return getRequestPromise(url, 'get', null, options);
  },
  head: function head(url, options) {
    return getRequestPromise(url, 'head', null, options);
  },
  jsonp: function jsonp(url, options) {
    return getRequestPromise(url, 'jsonp', null, options);
  },
  delete: function _delete(url, body, options) {
    return getRequestPromise(url, 'delete', body, options);
  },
  post: function post(url, body, options) {
    return getRequestPromise(url, 'post', body, options);
  },
  put: function put(url, body, options) {
    return getRequestPromise(url, 'put', body, options);
  },
  patch: function patch(url, body, options) {
    return getRequestPromise(url, 'patch', body, options);
  }
};
/**
 * @param {Object} json
 */
httpFetch.jsonToUrlParams = function (json) {
  var urlParams = '';
  for (var param in json) {
    if (!json.hasOwnProperty(param)) break;
    var val = json[param];
    if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') val = JSON.stringify(val);
    urlParams += param + '=' + window.encodeURIComponent(val) + '&';
  }
  return urlParams.substr(0, urlParams.length - 1);
};
module.exports = httpFetch;
