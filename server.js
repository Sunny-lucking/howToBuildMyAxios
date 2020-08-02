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
