# http-fetch
使用fetch代替ajax请求

## 安装
```
npm install http-fetch
```
## 使用
```
import httpFetch from 'http-fetch'
// 发起一个get请求
httpFetch.get('/users')
  .then(response => console.log(response))
```
## 配置
### onError
全局错误处理。
```
httpFetch.onError = error => console.dir(error)
```
**Error**对象
```
{
  url: '请求地址',
  body: '请求参数',
  method: '请求方法',
  status: 'http返回码',
  data: '请求结果',
  type: 'httpFetchError'
}
```
### onRequest
请求提交的拦截器。一般用于修改提交参数／终止请求
```
// 修改提交参数
httpFetch.onRequest = (request, next) {
  request.body = '...'
  next()
}
// 终止请求
httpFetch.onRequest = (request, next) {
  // 传入任意非undefined参数表示终止请求并立即resolve你传入的参数
  next('不给你请求！')
}
```
**Request**对象
```
{
  url: '请求地址',
  body: '请求参数',
  method: '请求方法',
  options: '请求配置'
}
```
### onResponse
请求返回的拦截器。一般用于修改返回参数／**返回自定义异常**<br>
```
// 修改返回参数
httpFetch.onResponse = (response, next) => {
  response.data = '...'
  next()
}
// 返回自定义异常
// 请认真看下面错误对象的定义过程
// 抛出的异常会正常走全局onError ＝> 局部catch的流程
httpFetch.onResponse = (response, next) => {
  var data = response.data
  if (data.hasOwnProperty('err_msg')) {
    var error = Error(data.err_msg)
    // httpFetch仅会处理type = 'httpFetchError'的错误，否则抛出
    error.type = 'httpFetchError'
    throw error
  } else next()
}
```
**Response**对象
```
{
  url: '请求地址',
  body: '请求参数',
  method: '请求方法',
  options: '请求配置',
  data: '请求结果'
}
```
**next([resolveData])**方法<br>
你可以传入一个参数来代替本次的Response
```
httpFetch.onResponse = (response, next) => {
  if (response.url === '/hello') next({msg: 'hello'})
  else next()
}
httpFetch.get('/hello')
  .then(response => {
    // response: {msg: 'hello'}
  })
```
### cache
应用层缓存。默认false（**仅缓存'get', 'head', 'jsonp'这三种请求**）
```
// 同一个请求会从缓存中取，除非刷新了页面。
httpFetch.cache = true
// 你也可以设置一个超时时间（单位：毫秒），过期则重新获取
httpFetch.cache = 3600000
```
### loading
获取数据的等待提示。用于给所有请求添加等待提示。
```
// 配置获取数据的等待提示
httpFetch.loading = {
  show () {
    // 这里写等待提示的显示方法
  },
  hide () {
    // 这里写等待提示的关闭方法
  }
}
```
### requestOptions
[fetch request请求配置](https://developer.mozilla.org/en-US/docs/Web/API/Request)
```
// 注意：method和body配置项你无法修改，因为这两项已经默认在你的请求方法中了
httpFetch.requestOptions = {
  headers: {
    // 配置请求头
  },
  // 配置跨域模式
  mode: 'no-cors'
}
```

## 默认行为
* 所有Response.data||Error.data优先转成json格式
* 如果**600**毫秒内没有返回数据才会调用loading.show()
* 'Content-Type': 'application/x-www-form-urlencoded'
* 'Cache-Control': 'no-cache'
* 'X-Requested-With': 'XMLHttpRequest'
* credentials: 'same-origin'
* jsonp请求的回调参数名为'callback'

## 请求方法
* get (url, [option])
* head (url, [option])
* jsonp (url, [option])
* delete (url, body, [option])
* post (url, body, [option])
* put (url, body, [option])
* patch (url, body, [option])

### url
请求地址

### body
请求参数 [Fetch Body](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Body)

### option
```
{
  // 错误处理模式 0：交给全局onError处理 1：本次请求自行catch处理 2：全局onError＋自行catch处理 默认：0
  errMode: 0,
  // 是否走全局request拦截器 默认：true
  hookRequest: true,
  // 是否走全局response拦截器 默认：true
  hookResponse: true,
  // 本次请求是否显示等待提示 默认：true
  loading: true,
  // 本次请求的缓存配置 默认：全局cache配置
  cache: true,
  // 本次请求的fetch request配置 默认：全局requestOptions配置
  requestOptions: {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
}
```
*cache的检测机制是通过对比request.url和request.method是否相同来决定是否复用*

## 其他方法
### jsonToUrlParams (json)
用于将json对象转成url参数
```
var json = {
  name: '张三',
  age: 18
}
console.log(httpFetch.jsonToUrlParams(json))
// 返回：'name=张三&age=18'
```

## 兼容问题
如果浏览器原生不支持fetch方法，在使用本插件之前，先在您项目的入口文件中引入一次[Fetch Polyfill](https://github.com/github/fetch)即可解决。
