/**
 * Created by aweiu on 16/10/28.
 */
var httpFetch = {}
function setOption (option, name, val) {
  option[name] = option[name] || val
}
for (let method of ['get', 'head', 'delete', 'post', 'put', 'patch']) {
  httpFetch[method] = function (url, body, options = {}) {
    var fetchOptions = JSON.parse(JSON.stringify(options))
    fetchOptions.method = method
    fetchOptions.body = body
    setOption(fetchOptions, 'credentials', 'same-origin')
    setOption(fetchOptions, 'headers', {})
    setOption(fetchOptions.headers, 'Cache-Control', 'no-cache')
    setOption(fetchOptions.headers, 'X-Requested-With', 'XMLHttpRequest')
    if (!fetchOptions.headers.hasOwnProperty('Content-Type') && typeof body === 'string') fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    return window.fetch(url, fetchOptions)
      .then(rs => {
        return rs.text()
          .then(text => {
            if (rs.ok) return text
            var error = Error('httpFetchError:' + (rs.statusText || 'Unknown Error StatusText'))
            error.url = url
            error.body = body
            error.method = method
            error.status = rs.status
            error.data = text
            error.type = 'httpFetchError'
            throw error
          })
      })
      .catch(e => {
        if (e.type === 'httpFetchError') throw e
        e.message = 'httpFetchError:' + e.message
        e.url = url
        e.type = 'httpFetchError'
        throw e
      })
  }
}
export default httpFetch
