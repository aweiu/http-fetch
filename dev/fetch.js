/**
 * Created by aweiu on 16/10/28.
 */
var httpFetch = {}
for (let method of ['get', 'head', 'delete', 'post', 'put', 'patch']) {
  httpFetch[method] = function (url, body) {
    return window.fetch(url, {
      method: method,
      body: body,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(rs => {
        return rs.text()
          .then(text => {
            if (rs.ok) return text
            var error = Error('httpFetchError:' + rs.statusText)
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
        e.message = 'httpFetchError:' + e.message
        e.url = url
        e.type = 'httpFetchError'
        throw e
      })
  }
}
export default httpFetch
