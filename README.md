# howToBuildMyAxios
手写axios核心原理
## 手写axios核心原理，再也不怕面试官问我axios原理

![](https://imgkr2.cn-bj.ufileos.com/58431a58-d8f6-450d-b701-9138e7e79e11.png?UCloudPublicKey=TOKEN_8d8b72be-579a-4e83-bfd0-5f6ce1546f13&Signature=hDyLyZham1LjUpXws%252BKK4DGUzKY%253D&Expires=1603089718)
###  手写axios核心原理
[toc]
## 一、axios简介 
### axios是什么？
Axios 是一个基于 promise 的 HTTP 库，可以用在浏览器和 node.js 中。
### axios有什么特性？（不得不说面试被问到几次）

- 从浏览器中创建 XMLHttpRequests从 node.js 
- 创建 http 请求
- 支持 Promise API
- 拦截请求和响应转换请求数据和响应数据
- 取消请求
- 自动转换JSON 数据
- 客户端支持防御 XSRF

实际上，axios可以用在浏览器和 node.js 中是因为，它会自动判断当前环境是什么，**如果是浏览器，就会基于XMLHttpRequests实现axios。如果是node.js环境，就会基于node内置核心模块http实现axios**
简单来说，axios的基本原理就是

1. axios还是属于 XMLHttpRequest， 因此需要实现一个ajax。或者基于http 。
2. 还需要一个promise对象来对结果进行处理。

>有什么不理解的或者是建议欢迎评论提出.项目已经放到github.可以的话给个star吧！谢谢
github：https://github.com/Sunny-lucking/howToBuildMyAxios

## 二、基本使用方式 
axios基本使用方式主要有

1. axios(config)
2. axios.method(url, data , config)


```js
// index.html文件
<html>
<script type="text/javascript" src="./myaxios.js"></script>
<body>
<button class="btn">点我发送请求</button>
<script>
    document.querySelector('.btn').onclick = function() {
        // 分别使用以下方法调用，查看myaxios的效果
        axios.post('/postAxios', {
          name: '小美post'
        }).then(res => {
          console.log('postAxios 成功响应', res);
        })

        axios({
          method: 'post',
          url: '/getAxios'
        }).then(res => {
          console.log('getAxios 成功响应', res);
        })
    }
</script>
</body>
</html>
</html>
```


## 三、实现axios和axios.method 
从axios(config)的使用上可以看出导出的axios是一个方法。从axios.method(url, data , config)的使用可以看出导出的axios上或者原型上挂有get，post等方法。

实际上导出的axios就是一个Axios类中的一个方法。

如代码所以，核心代码是request。我们把request导出，就可以使用axios(config)这种形式来调用axios了。

```js
class Axios {
    constructor() {

    }

    request(config) {
        return new Promise(resolve => {
            const {url = '', method = 'get', data = {}} = config;
            // 发送ajax请求
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onload = function() {
                console.log(xhr.responseText)
                resolve(xhr.responseText);
            }
            xhr.send(data);
        })
    }
}
```


怎么导出呢？十分简单，new Axios，获得axios实例，再获得实例上的request方法就好了。

```js
// 最终导出axios的方法，即实例的request方法
function CreateAxiosFn() {
    let axios = new Axios();
    let req = axios.request.bind(axios);
    return req;
}
```



```js
// 得到最后的全局变量axios
let axios = CreateAxiosFn();
```


[点击查看此时的myAxios.js](https://github.com/Sunny-lucking/howToBuildMyAxios/commit/60d7491a9b44080aaac773de1c6b8409879ff70e)

现在axios实际上就是request方法。

你可能会很疑惑，因为我当初看源码的时候也很疑惑：干嘛不直接写个request方法，然后导出呢？非得这样绕这么大的弯子。别急。后面慢慢就会讲到。

现在一个简单的axios就完成了，我们来引入myAxios.js文件并测试一下可以使用不？

简单的搭建服务器：

```js
//server.js
var express = require('express');
var app = express();

//设置允许跨域访问该服务.
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json;charset=utf-8');
    next();
});

app.get('/getTest', function(request, response){
    data = {
        'FrontEnd':'前端',
        'Sunny':'阳光'
    };
    response.json(data);
});
var server = app.listen(5000, function(){
    console.log("服务器启动");
});
```





```js
//index.html
<script type="text/javascript" src="./myAxios.js"></script>

<body>
<button class="btn">点我发送请求</button>
<script>
    document.querySelector('.btn').onclick = function() {
        // 分别使用以下方法调用，查看myaxios的效果
        axios({
          method: 'get',
          url: 'http://localhost:5000/getTest'
        }).then(res => {
          console.log('getAxios 成功响应', res);
        })
    }
</script>
</body>
```


点击按钮，看看是否能成功获得数据。

发现确实成功。

可喜可贺

现在我们来实现下axios.method()的形式。

**思路**：我们可以再Axios.prototype添加这些方法。而这些方法内部调用request方法即可，如代码所示：

```js
// 定义get,post...方法，挂在到Axios原型上
const methodsArr = ['get', 'delete', 'head', 'options', 'put', 'patch', 'post'];
methodsArr.forEach(met => {
    Axios.prototype[met] = function() {
        console.log('执行'+met+'方法');
        // 处理单个方法
        if (['get', 'delete', 'head', 'options'].includes(met)) { // 2个参数(url[, config])
            return this.request({
                method: met,
                url: arguments[0],
                ...arguments[1] || {}
            })
        } else { // 3个参数(url[,data[,config]])
            return this.request({
                method: met,
                url: arguments[0],
                data: arguments[1] || {},
                ...arguments[2] || {}
            })
        }

    }
})
```


我们通过遍历methodsArr数组，依次在Axios.prototype添加对应的方法，注意的是'`get`', '`delete`', '`head`', '`options`'这些方法只接受两个参数。而其他的可接受三个参数，想一下也知道，get不把参数放body的。

但是，你有没有发现，我们只是在Axios的`prototype`上添加对应的方法，我们导出去的可是`request`方法啊，那怎么办？ 简单，把`Axios.prototype`上的方法搬运到`request`上即可。

我们先来实现一个工具方法，实现将b的方法混入a;


```js
const utils = {
  extend(a,b, context) {
    for(let key in b) {
      if (b.hasOwnProperty(key)) {
        if (typeof b[key] === 'function') {
          a[key] = b[key].bind(context);
        } else {
          a[key] = b[key]
        }
      }
      
    }
  }
}
```



然后我们就可以利用这个方法将`Axios.prototype`上的方法搬运到request上啦。

我们修改一下之前的`CreateAxiosFn`方法即可

```js
function CreateAxiosFn() {
  let axios = new Axios();
  
  let req = axios.request.bind(axios);
  增加代码
  utils.extend(req, Axios.prototype, axios)
  
  return req;
}
```

[点击查看此时的myAxios.js](https://github.com/Sunny-lucking/howToBuildMyAxios/commit/cf134fbbcacadb44fe3ca9e297386fa4b98b8014)

现在来测试一下能不能使用axios.get()这种形式调用axios。


```js
<body>
<button class="btn">点我发送请求</button>
<script>
    document.querySelector('.btn').onclick = function() {

        axios.get('http://localhost:5000/getTest')
            .then(res => {
                 console.log('getAxios 成功响应', res);
            })

    }
</script>
</body>
```




害，又是意料之中成功。
再完成下一个功能之前，先给上目前myAxios.js的完整代码

```js
class Axios {
    constructor() {

    }

    request(config) {
        return new Promise(resolve => {
            const {url = '', method = 'get', data = {}} = config;
            // 发送ajax请求
            console.log(config);
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onload = function() {
                console.log(xhr.responseText)
                resolve(xhr.responseText);
            }
            xhr.send(data);
        })
    }
}

// 定义get,post...方法，挂在到Axios原型上
const methodsArr = ['get', 'delete', 'head', 'options', 'put', 'patch', 'post'];
methodsArr.forEach(met => {
    Axios.prototype[met] = function() {
        console.log('执行'+met+'方法');
        // 处理单个方法
        if (['get', 'delete', 'head', 'options'].includes(met)) { // 2个参数(url[, config])
            return this.request({
                method: met,
                url: arguments[0],
                ...arguments[1] || {}
            })
        } else { // 3个参数(url[,data[,config]])
            return this.request({
                method: met,
                url: arguments[0],
                data: arguments[1] || {},
                ...arguments[2] || {}
            })
        }

    }
})


// 工具方法，实现b的方法或属性混入a;
// 方法也要混入进去
const utils = {
  extend(a,b, context) {
    for(let key in b) {
      if (b.hasOwnProperty(key)) {
        if (typeof b[key] === 'function') {
          a[key] = b[key].bind(context);
        } else {
          a[key] = b[key]
        }
      }
      
    }
  }
}


// 最终导出axios的方法-》即实例的request方法
function CreateAxiosFn() {
    let axios = new Axios();

    let req = axios.request.bind(axios);
    // 混入方法， 处理axios的request方法，使之拥有get,post...方法
    utils.extend(req, Axios.prototype, axios)
    return req;
}

// 得到最后的全局变量axios
let axios = CreateAxiosFn();
```


## 四、请求和响应拦截器 
我们先看下拦截器的使用

```js
// 添加请求拦截器
axios.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    return config;
  }, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  });

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    return response;
  }, function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  });
```


拦截器是什么意思呢？其实就是在我们发送一个请求的时候会先执行请求拦截器的代码，然后再真正地执行我们发送的请求，这个过程会对config，也就是我们发送请求时传送的参数进行一些操作。

而当接收响应的时候，会先执行响应拦截器的代码，然后再把响应的数据返回来，这个过程会对response，也就是响应的数据进行一系列操作。

怎么实现呢？需要明确的是拦截器也是一个类，管理响应和请求。因此我们先实现拦截器


```js
class InterceptorsManage {
  constructor() {
    this.handlers = [];
  }

  use(fullfield, rejected) {
    this.handlers.push({
      fullfield,
      rejected
    })
  }
}
```

我们是用这个语句`axios.interceptors.response.use`和`axios.interceptors.request.use`，来触发拦截器执行use方法的。

说明axios上有一个响应拦截器和一个请求拦截器。那怎么实现Axios呢？看代码


```js
class Axios {
    constructor() {
        新增代码
        this.interceptors = {
            request: new InterceptorsManage,
            response: new InterceptorsManage
        }
    }

    request(config) {
        return new Promise(resolve => {
            const {url = '', method = 'get', data = {}} = config;
            // 发送ajax请求
            console.log(config);
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onload = function() {
                console.log(xhr.responseText)
                resolve(xhr.responseText);
            };
            xhr.send(data);
        })
    }
}
```


可见，axios实例上有一个对象interceptors。这个对象有两个拦截器，一个用来处理请求，一个用来处理响应。

所以，我们执行语句`axios.interceptors.response.use`和`axios.interceptors.request.use`的时候，实现获取axios实例上的interceptors对象，然后再获取response或request拦截器，再执行对应的拦截器的use方法。

而执行use方法，会把我们传入的回调函数push到拦截器的handlers数组里。

到这里你有没有发现一个问题。这个interceptors对象是Axios上的啊，我们导出的是request方法啊（欸？好熟悉的问题，上面提到过哈哈哈~~~额）。处理方法跟上面处理的方式一样，都是把Axios上的方法和属性搬到request过去，也就是遍历Axios实例上的方法，得以将interceptors对象挂载到request上。

所以只要更改下CreateAxiosFn方法即可。


```js
function CreateAxiosFn() {
  let axios = new Axios();
  
  let req = axios.request.bind(axios);
  // 混入方法， 处理axios的request方法，使之拥有get,post...方法
  utils.extend(req, Axios.prototype, axios)
  新增代码
  utils.extend(req, axios)
  return req;
}
```


好了，现在request也有了interceptors对象，那么什么时候拿interceptors对象中的handler之前保存的回调函数出来执行。

没错，就是我们发送请求的时候，会先获取request拦截器的handlers的方法来执行。再执行我们发送的请求，然后获取response拦截器的handlers的方法来执行。

因此，我们要修改之前所写的request方法
之前是这样的。


```js
request(config) {
    return new Promise(resolve => {
        const {url = '', method = 'get', data = {}} = config;
        // 发送ajax请求
        console.log(config);
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.onload = function() {
            console.log(xhr.responseText)
            resolve(xhr.responseText);
        };
        xhr.send(data);
    })
}
```

但是现在request里不仅要执行发送ajax请求，还要执行拦截器handlers中的回调函数。所以，最好下就是将执行ajax的请求封装成一个方法


```
request(config) {
    this.sendAjax(config)
}
sendAjax(config){
    return new Promise(resolve => {
        const {url = '', method = 'get', data = {}} = config;
        // 发送ajax请求
        console.log(config);
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.onload = function() {
            console.log(xhr.responseText)
            resolve(xhr.responseText);
        };
        xhr.send(data);
    })
}
```

好了，现在我们要获得handlers中的回调

```js
request(config) {
    // 拦截器和请求组装队列
    let chain = [this.sendAjax.bind(this), undefined] // 成对出现的，失败回调暂时不处理

    // 请求拦截
    this.interceptors.request.handlers.forEach(interceptor => {
        chain.unshift(interceptor.fullfield, interceptor.rejected)
    })

    // 响应拦截
    this.interceptors.response.handlers.forEach(interceptor => {
        chain.push(interceptor.fullfield, interceptor.rejected)
    })

    // 执行队列，每次执行一对，并给promise赋最新的值
    let promise = Promise.resolve(config);
    while(chain.length > 0) {
        promise = promise.then(chain.shift(), chain.shift())
    }
    return promise;
}

```

我们先把sendAjax请求和undefined放进了chain数组里，再把请求拦截器的handlers的成对回调放到chain数组头部。再把响应拦截器的handlers的承兑回调反倒chain数组的尾部。

然后再 逐渐取数 chain数组的成对回调执行。


```js
promise = promise.then(chain.shift(), chain.shift())
```

这一句，实际上就是不断将config从上一个promise传递到下一个promise，期间可能回调config做出一些修改。什么意思？我们结合一个例子来讲解一下

首先拦截器是这样使用的
```js
// 添加请求拦截器

axios.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    return config;
  }, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  });

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    return response;
  }, function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  });
```

然后执行request的时候。chain数组的数据是这样的

```js
chain = [
  function (config) {
    // 在发送请求之前做些什么
    return config;
  }, 
  
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
  this.sendAjax.bind(this), 
  
  undefined,
  
  function (response) {
    // 对响应数据做点什么
    return response;
  }, 
  function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
]
```


。
### 首先
执行第一次promise.then(chain.shift(), chain.shift())，即

```js
promise.then(
  function (config) {
    // 在发送请求之前做些什么
    return config;
  }, 
  
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
)
```

一般情况，promise是resolved状态，是执行成功回调的，也就是执行

```js
function (config) {
    // 在发送请求之前做些什么
    return config;
  }, 
```

而promise.then是要返回一个新的promise对象的。
为了区分，在这里，我会把这个新的promise对象叫做第一个新的promise对象
这个第一个新的promise对象会把

```js
function (config) {
    // 在发送请求之前做些什么
    return config;
  }, 
```

的执行结果传入resolve函数中

```
resolve(config)
```

使得这个返回的第一个新的promise对象的状态为resovled，而且第一个新的promise对象的data为config。

这里需要对Promise的原理足够理解。所以我前一篇文章写的是手写Promise核心原理，再也不怕面试官问我Promise原理，你可以去看看

### 接下来，再执行

```js
promise.then(
  sendAjax(config)
  ,
  undefined
)
```

注意：这里的promise是 上面提到的第一个新的promise对象。

而promise.then这个的执行又会返回第二个新的promise对象。

因为这里promise.then中的promise也就是第一个新的promise对象的状态是resolved的，所以会执行sendAjax()。而且会取出第一个新的promise对象的data 作为config转入sendAjax()。

当sendAjax执行完，就会返回一个response。这个response就会保存在第二个新的promise对象的data中。

### 接下来，再执行


```js
promise.then(
  function (response) {
    // 对响应数据做点什么
    return response;
  }, 
  function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
)
```

同样，会把第二个新的promise对象的data取出来作为response参数传入

```js
function (response) {
    // 对响应数据做点什么
    return response;
  }, 
```

饭后返回一个promise对象，这个promise对象的data保存了这个函数的执行结果，也就是返回值response。

然后通过return promise;

把这个promise返回了。咦？是怎么取出promise的data的。我们看看我们平常事怎么获得响应数据的

```js
axios.get('http://localhost:5000/getTest')
    .then(res => {
         console.log('getAxios 成功响应', res);
    })
```

在then里接收响应数据。所以原理跟上面一样，将返回的promise的data作为res参数了。

现在看看我们的myAxios完整代码吧，好有个全面的了解


```js
class InterceptorsManage {
    constructor() {
        this.handlers = [];
    }

    use(fullfield, rejected) {
        this.handlers.push({
            fullfield,
            rejected
        })
    }
}

class Axios {
    constructor() {
        this.interceptors = {
            request: new InterceptorsManage,
            response: new InterceptorsManage
        }
    }

    request(config) {
        // 拦截器和请求组装队列
        let chain = [this.sendAjax.bind(this), undefined] // 成对出现的，失败回调暂时不处理

        // 请求拦截
        this.interceptors.request.handlers.forEach(interceptor => {
            chain.unshift(interceptor.fullfield, interceptor.rejected)
        })

        // 响应拦截
        this.interceptors.response.handlers.forEach(interceptor => {
            chain.push(interceptor.fullfield, interceptor.rejected)
        })

        // 执行队列，每次执行一对，并给promise赋最新的值
        let promise = Promise.resolve(config);
        while(chain.length > 0) {
            promise = promise.then(chain.shift(), chain.shift())
        }
        return promise;
    }
    sendAjax(){
        return new Promise(resolve => {
            const {url = '', method = 'get', data = {}} = config;
            // 发送ajax请求
            console.log(config);
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onload = function() {
                console.log(xhr.responseText)
                resolve(xhr.responseText);
            };
            xhr.send(data);
        })
    }
}

// 定义get,post...方法，挂在到Axios原型上
const methodsArr = ['get', 'delete', 'head', 'options', 'put', 'patch', 'post'];
methodsArr.forEach(met => {
    Axios.prototype[met] = function() {
        console.log('执行'+met+'方法');
        // 处理单个方法
        if (['get', 'delete', 'head', 'options'].includes(met)) { // 2个参数(url[, config])
            return this.request({
                method: met,
                url: arguments[0],
                ...arguments[1] || {}
            })
        } else { // 3个参数(url[,data[,config]])
            return this.request({
                method: met,
                url: arguments[0],
                data: arguments[1] || {},
                ...arguments[2] || {}
            })
        }

    }
})


// 工具方法，实现b的方法混入a;
// 方法也要混入进去
const utils = {
    extend(a,b, context) {
        for(let key in b) {
            if (b.hasOwnProperty(key)) {
                if (typeof b[key] === 'function') {
                    a[key] = b[key].bind(context);
                } else {
                    a[key] = b[key]
                }
            }

        }
    }
}


// 最终导出axios的方法-》即实例的request方法
function CreateAxiosFn() {
    let axios = new Axios();

    let req = axios.request.bind(axios);
    // 混入方法， 处理axios的request方法，使之拥有get,post...方法
    utils.extend(req, Axios.prototype, axios)
    return req;
}

// 得到最后的全局变量axios
let axios = CreateAxiosFn();
```




来测试下拦截器功能是否正常

```html
<script type="text/javascript" src="./myAxios.js"></script>

<body>
<button class="btn">点我发送请求</button>
<script>
    // 添加请求拦截器
    axios.interceptors.request.use(function (config) {
        // 在发送请求之前做些什么
        config.method = "get";
        console.log("被我请求拦截器拦截了，哈哈:",config);
        return config;
    }, function (error) {
        // 对请求错误做些什么
        return Promise.reject(error);
    });

    // 添加响应拦截器
    axios.interceptors.response.use(function (response) {
        // 对响应数据做点什么
        console.log("被我响应拦截拦截了，哈哈 ");
        response = {message:"响应数据被我替换了，啊哈哈哈"}
        return response;
    }, function (error) {
        // 对响应错误做点什么
        console.log("错了吗");
        return Promise.reject(error);
    });
    document.querySelector('.btn').onclick = function() {
        // 分别使用以下方法调用，查看myaxios的效果
        axios({
          url: 'http://localhost:5000/getTest'
        }).then(res => {
          console.log('response', res);
        })
    }
</script>
</body>
```
拦截成功！！！！！全掘金人民向我们发来贺电！！！！

有什么不理解的或者是建议欢迎评论提出

>感谢您也恭喜您看到这里，我可以卑微的求个star吗！！！

>github：https://github.com/Sunny-lucking/howToBuildMyAxios



