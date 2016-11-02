/**
 * Created by aweiu on 16/10/28.
 */
import fetch from './fetch'
import jsonp from './jsonp'
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
    if (typeof httpFetch.cache === 'function' && httpFetch.cache(response.data)) {
      try {
        window.localStorage.setItem(url, JSON.stringify(responseData))
      } catch (e) {
        console.warn('can not cache this responseData')
        console.log(responseData)
      }
    }
  }
  if (checkOption(request.options, 'hookResponse') && typeof httpFetch.onResponse === 'function') httpFetch.onResponse(response, next)
  else next()
}
function request (request, resolve, reject) {
  request.options = request.options || {
      errMode: 0,
      hookRequest: true,
      hookResponse: true,
      loading: true
    }
  var next = (resolveData) => {
    if (resolveData !== undefined) return resolve(resolveData)
    if (checkOption(request.options, 'loading')) var loadingTimer = showLoading()
    var responseArgs = [
      request,
      typeof httpFetch.cache === 'function' ? window.localStorage.getItem(request.url) : false,
      resolve
    ]
    if (responseArgs[1]) return onResponse.apply(null, responseArgs)
    const requestMethod = fetch[request.method] || jsonp
    requestMethod(request.url, request.body)
      .then(data => {
        hideLoading(loadingTimer)
        // 防止误关闭
        loadingTimer = undefined
        responseArgs[1] = data
        onResponse.apply(null, responseArgs)
      })
      .catch(e => {
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
        options: options
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
