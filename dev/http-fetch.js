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
function onResponse (response, method, url, body, resolve, options) {
  var result = {
    url: url,
    body: body,
    method: method,
    options: options,
    response: tryToJson(response)
  }
  var next = (rs = result.response) => {
    resolve(rs)
    if (typeof httpFetch.afterResolve === 'function' && checkOption(options, 'afterResolve')) httpFetch.afterResolve(result)
    if (typeof httpFetch.cache === 'function' && httpFetch.cache(result)) window.localStorage.setItem(url, JSON.stringify(result))
  }
  if (typeof httpFetch.beforeResolve === 'function' && checkOption(options, 'beforeResolve')) httpFetch.beforeResolve(result, next)
  else next()
}
function request (method, url, body, resolve, reject, options = {
  errMode: 0,
  beforeResolve: true,
  afterResolve: true,
  loading: true
}) {
  if (checkOption(options, 'loading')) var loadingTimer = showLoading()
  var responseArgs = [
    typeof httpFetch.cache === 'function' ? window.localStorage.getItem(url) : false,
    method,
    url,
    body,
    resolve,
    options
  ]
  if (responseArgs[0]) return onResponse.apply(null, responseArgs)
  const requestMethod = fetch[method] || jsonp
  requestMethod(url, body)
    .then(rs => {
      hideLoading(loadingTimer)
      // 防止误关闭
      loadingTimer = undefined
      responseArgs[0] = rs
      onResponse.apply(null, responseArgs)
    })
    .catch(e => {
      hideLoading(loadingTimer)
      if (e.type !== 'httpFetchError') throw e
      e.url = url
      e.body = body
      e.method = method
      e.response = tryToJson(e.response)
      if (options.errMode === 1 || options.errMode === 2) reject(e)
      if (options.errMode !== 1) {
        if (typeof httpFetch.onError === 'function') httpFetch.onError(e)
        else throw e
      }
    })
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
      request(method, url, body, resolve, reject, options)
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
