/**
 * Created by aweiu on 16/10/28.
 */
import fetch from './fetch'
import jsonp from './jsonp'
var resource = {
  cache: {},
  getCacheOption (options) {
    return options.hasOwnProperty('cache') ? options.cache : httpFetch.cache;
  },
  fetch (request) {
    return (fetch[request.method] || jsonp)(request.url, request.body)
  },
  setCache (request, requestStr) {
    var promise = this.fetch(request)
    this.cache[requestStr] = [promise, new Date()]
    return promise
  },
  getCache (requestStr, cacheOption) {
    var cache = this.cache[requestStr];
    if (cache && (cacheOption === true || new Date() - cache[1] < cacheOption)) return cache[0]
  },
  get (request) {
    var requestStr = JSON.stringify(request)
    var cacheOption = this.getCacheOption(request.options)
    if (cacheOption) {
      var cacheResource = this.getCache(requestStr, cacheOption)
      return cacheResource ? cacheResource : this.setCache(request, requestStr)
    } else return this.fetch(request)
  }
};
function tryToJson (data) {
  try {
    return JSON.parse(data)
  } catch (e) {
    return data || {}
  }
}
function checkOption (options, key) {
  return !options.hasOwnProperty(key) || options[key]
}
function onResponse (request, responseData, resolve) {
  var response = request
  response.data = tryToJson(responseData)
  var next = (rs = response) => {
    resolve(rs)
  }
  if (checkOption(request.options, 'hookResponse') && typeof httpFetch.onResponse === 'function') httpFetch.onResponse(response, next)
  else next()
}
function request (request, resolve, reject) {
  var next = resolveData => {
    if (resolveData !== undefined) return resolve(resolveData)
    if (checkOption(request.options, 'loading')) var loadingTimer = showLoading()
    resource.get(request)
      .then(function (data) {
        hideLoading(loadingTimer);
        // 防止误关闭
        loadingTimer = undefined;
        onResponse(request, data, resolve)
      }).catch(function (e) {
        hideLoading(loadingTimer)
        if (e.type !== 'httpFetchError') throw e
        e.data = tryToJson(e.data)
        if (request.options.errMode === 1 || request.options.errMode === 2) reject(e)
        if (request.options.errMode !== 1) {
          if (typeof httpFetch.onError === 'function') httpFetch.onError(e)
          else throw e
        }
      })
  }
  if (checkOption(request.options, 'hookRequest') && typeof httpFetch.onRequest === 'function') httpFetch.onRequest(request, next)
  else next()
}
function showLoading () {
  if (httpFetch.hasOwnProperty('loading') && typeof httpFetch.loading.show === 'function') {
    return setTimeout(() => {
      httpFetch.loading.show()
    }, 600)
  }
}
function hideLoading (timer) {
  if (timer !== undefined && httpFetch.hasOwnProperty('loading') && typeof httpFetch.loading.hide === 'function') {
    clearTimeout(timer)
    httpFetch.loading.hide()
  }
}
var httpFetch = {}
const methods = ['get', 'head', 'jsonp', 'delete', 'post', 'put', 'patch']
for (let method of methods) {
  httpFetch[method] = function (url, body, options) {
    if (methods.indexOf(method) < 3) {
      options = body
      body = null
    }
    return new Promise((resolve, reject) => {
      request({
        url: url,
        body: body,
        method: method,
        options: options || {}
      }, resolve, reject)
    })
  }
}
/**
 * @param {Object} json
 */
httpFetch.jsonToUrlParams = function (json) {
  var urlParams = ''
  for (var param in json) {
    if (!json.hasOwnProperty(param)) break
    var tmp = json[param]
    urlParams += `${param}=${typeof tmp === 'object' ? JSON.stringify(tmp) : tmp}&`
  }
  return urlParams.substr(0, urlParams.length - 1)
}
export default httpFetch
