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
    sendAjax(config){
        return new Promise(resolve => {
            const {url = '', method = 'get', data = {}} = config;
            // 发送ajax请求
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onload = function() {
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
    // 混入属性，处理axios的request方法，使之拥有axios实例上的所有属性
    utils.extend(req, axios)
    return req;
}

// 得到最后的全局变量axios
let axios = CreateAxiosFn();
