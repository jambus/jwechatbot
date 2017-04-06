"use strict";
const { Wechaty } = require('wechaty');
const http = require('http');
const querystring = require('querystring');  

const tulingAPIKey = 'e341f3cbed2f4faa9604df3f10246661';
const wechatBoyExpression = /lazyjambus|jambus|一个偷懒的码农/;

Wechaty.instance() // Singleton
    .on('scan', (url, code) => console.log(`Scan QR Code to login: ${code}\n${url}`))

.on('login', user => console.log(`User ${user} logined`))

.on('message', message => callTuling(message))

.init();

let callTuling = function(message) {

    const contact = message.from();
    const content = message.content();
    const room = message.room();

    console.log(`Message, From: ${contact} Content: ${message} Room:${room}`);

    if(message.self()){
        return;
    }
    else if(room && !wechatBoyExpression.test(content)){
        return;
    }

    let post_data = querystring.stringify({
      key: tulingAPIKey,
      info: content,
      userid: contact
    });

    let options = {
      host: 'www.tuling123.com',
      port: 80,
      path: '/openapi/api',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded', //这个一定要有
      }
    };

    let req = http.request(options, function(res) {
        console.log('Response');
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');

        if(res.statusCode === 200){
            res.on('data', function(chunk) {
                console.log('BODY: ' + chunk);
                tulingCallBack(message,chunk);
            });
        }else{
            tulingCallBack(message,{"code":100000,"text":"今天心情不太好，不理你了！"});
        }
    });

    req.on('error', function (e) {  
        console.log('problem with request: ' + e.message);  
    });  

    req.write(post_data);
    req.end();
}

let tulingCallBack = function(message,chunk){
    let data = JSON.parse(chunk);
    if(/hello/.test(message.content())){
        //TODO   
    }
    message.say(data["text"]);
}
