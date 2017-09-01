/**
 * Created by aweiu on 16/10/28.
 */
import fetch from './fetch'
import jsonp from './jsonp'

const resource = {
  cache: {},
  getCacheOption (options) {
    return options.hasOwnProperty('cache') ? options.cache : httpFetch.cache
  },
  fetch (request) {
    return request.method === 'jsonp' ? jsonp(request.url) : fetch(request.url, request.method, request.body, request.options.requestOptions || httpFetch.requestOptions)
  },
  setCache (request, eigenvalue) {
    const promise = this.fetch(request)
    this.cache[eigenvalue] = [promise, new Date()]
    return promise
  },
  getCache (eigenvalue, cacheOption) {
    const cache = this.cache[eigenvalue]
    if (cache && (cacheOption === true || new Date() - cache[1] < cacheOption)) return cache[0]
  },
  get (request) {
    const cacheOption = this.getCacheOption(request.options)
    // 仅缓存如下三种请求
    if (cacheOption && ['get', 'head', 'jsonp'].indexOf(request.method) !== -1) {
      const eigenvalue = `url=${request.url}&method=${request.method}`
      const cacheResource = this.getCache(eigenvalue, cacheOption)
      return cacheResource || this.setCache(request, eigenvalue)
    } else return this.fetch(request)
  }
}

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
  const response = request
  response.data = tryToJson(responseData)
  const next = (rs = response) => {
    resolve(rs)
  }
  if (checkOption(request.options, 'hookResponse') && typeof httpFetch.onResponse === 'function') httpFetch.onResponse(response, next)
  else next()
}

function request (request, resolve, reject) {
  const next = resolveData => {
    let loadingData
    if (resolveData !== undefined) return resolve(resolveData)
    if (checkOption(request.options, 'loading')) loadingData = showLoading()
    resource.get(request)
      .then(function (data) {
        hideLoading(loadingData)
        onResponse(request, data, resolve)
      })
      .catch(function (e) {
        hideLoading(loadingData)
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
    const data = {
      timer: setTimeout(() => {
        data.showed = true
        data.showResult = httpFetch.loading.show()
      }, 600)
    }
    return data
  }
}

function hideLoading (loadingData) {
  if (loadingData && loadingData.timer && httpFetch.hasOwnProperty('loading') && typeof httpFetch.loading.hide === 'function') {
    clearTimeout(loadingData.timer)
    delete loadingData.timer
    if (loadingData.showed) httpFetch.loading.hide(loadingData.showResult)
  }
}

function getRequestPromise (url, method, body, options = {}) {
  return new Promise((resolve, reject) => {
    request({
      url: url,
      body: body,
      method: method,
      options: options
    }, resolve, reject)
  })
}

const httpFetch = {
  get: (url, options) => getRequestPromise(url, 'get', null, options),
  head: (url, options) => getRequestPromise(url, 'head', null, options),
  jsonp: (url, options) => getRequestPromise(url, 'jsonp', null, options),
  delete: (url, body, options) => getRequestPromise(url, 'delete', body, options),
  post: (url, body, options) => getRequestPromise(url, 'post', body, options),
  put: (url, body, options) => getRequestPromise(url, 'put', body, options),
  patch: (url, body, options) => getRequestPromise(url, 'patch', body, options)
}

/**
 * @param {Object} json
 */
httpFetch.jsonToUrlParams = function (json) {
  let urlParams = ''
  for (let param in json) {
    if (!json.hasOwnProperty(param)) break
    let val = json[param]
    if (typeof val === 'object') val = JSON.stringify(val)
    urlParams += `${param}=${window.encodeURIComponent(val)}&`
  }
  return urlParams.substr(0, urlParams.length - 1)
}
export default httpFetch
