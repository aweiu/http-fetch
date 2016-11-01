# http-fetch
使用fetch代替ajax请求

## 安装
```
npm install http-fetch
```
## 使用
```
import httpFetch from 'http-fetch'
// 以下配置非必须，按你的需求来
// 全局错误处理
httpFetch.onError =  e => {
  // 看看Error对象里都有些啥
  console.dir(e)
}
// 请求Promise resolve之前的hook
httpFetch.beforeResolve = (result, next) => {
  // result：包含了本次请求的基本信息和请求结果
  // next([resolveObject])：继续执行resolve，你可以传你的自定义对象来覆盖本次请求结果
}
// 请求Promise resolve之后的hook
httpFetch.afterResolve = result => {
  // result：包含了本次请求的基本信息和请求结果
}
// 配置localStorage缓存检测
httpFetch.cache = result => {
  // result：包含了本次请求的基本信息和请求结果
  // 如果请求结果中cache属性为true，则缓存本次结果
  return result.response.cache === true
}
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
## 配置
### onError
全局错误处理。参见上文**使用**中的例子<br>
**Error**对象
```
{
  url: '请求地址',
  body: '请求参数',
  method: '请求方法',
  status: 'http返回码',
  response: '请求结果',
  type: 'httpFetchError'
}
```
### beforeResolve
请求Promise resolve之前的hook。一般用于拦截请求／修改返回参数／**返回自定义异常**<br>
```
// 拦截请求
httpFetch.beforeResolve = (result, next) => {
  if (result.response.err_msg === 'need login') window.location.href = '/login'
  else next()
}
// 修改返回参数
httpFetch.beforeResolve = (result, next) => {
  // 将请求结果由response修改为response.data
  next(result.response.data)
}
// 返回自定义异常
// 请认真看下面错误对象的定义过程
// 抛出的异常会正常走全局onError ＝> 局部catch的流程
httpFetch.beforeResolve = (result, next) => {
  var rs = result.response
  if (rs.hasOwnProperty('err_msg')) {
    var error = Error(rs.err_msg)
    // httpFetch仅会处理type = 'httpFetchError'的错误，否则抛出
    error.type = 'httpFetchError'
    throw error
  } else next()
}
```
**Result**对象
```
{
  url: '请求地址',
  body: '请求参数',
  method: '请求方法',
  options: '请求配置',
  response: '请求结果'
}
```
**next([resolveObject])**方法<br>
你可以传入一个参数来代替本次的请求结果去resolve本次请求的promise
```
httpFetch.beforeResolve = (result, next) => {
  if (result.url === '/hello') next({msg: 'hello'})
  else next()
}
httpFetch.get('/hello')
  .then(rs => {
    // rs: {msg: 'hello'}
  })
```
### afterResolve
请求Promise resolve之后的hook。一般用于全局提示返回结果
```
httpFetch.afterResolve = result => {
  // 每次请求成功默认alert返回结果中的msg值
  window.alert(result.response.msg)
}
```
### cache
localStorage缓存检测。插件默认不缓存请求，可以通过配置该选项来实现将结果**永久**缓存至localStorage中<br>
一般用于缓存某些不轻易变更的信息，比如全国省市区信息。参见上文**使用**中的例子

### loading
获取数据的等待提示。用于给所有请求添加等待提示。参见上文**使用**中的例子<br>

## 默认行为
* 所有response优先转成json格式
* 如果**600**毫秒内没有返回数据才会调用loading.show()
* 'Content-Type': 'application/x-www-form-urlencoded'
* 'Cache-Control': 'no-cache'
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
  // 是否使用全局beforeResolve 默认：true
  beforeResolve: true,
  // 是否使用全局afterResolve 默认：true
  afterResolve: true,
  // 本次请求是否显示等待提示 默认：true
  loading: true
}
```
