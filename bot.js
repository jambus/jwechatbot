"use strict";
const { Wechaty } = require('wechaty');
const http = require('http');
const querystring = require('querystring');
const fs = require('fs');  

const tulingAPIKey = 'e341f3cbed2f4faa9604df3f10246661';
const wechatBoyExpression = /lazyjambus|jambus|一个偷懒的码农/;
const managedRoomExpression = /Bb羽毛球叽叽喳喳群|测试群/;

let callTuling = function(message) {

    const contact = message.from();
    const content = message.content();
    const room = message.room();
    const roomTopic = room.topic();

    console.log(`Message, From: ${contact} Content: ${message} Room:${roomTopic}`);

    if(message.self()){
        return;
    }
    else if(room && !(wechatBoyExpression.test(content) || managedRoomExpression.test(roomTopic))){
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

                if(managedRoomExpression.test(roomTopic)){
                    applicationHandle(message,chunk);
                }else{
                    tulingCallBack(message,chunk);
                }
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
    message.say(data["text"]);
}

let applicationHandle = function(message,chunk){
    let data = JSON.parse(chunk);

    const contact = message.from();
    if(/\++[1-9]+/.test(message.content())){
        if(!recordJson[contact]){
            recordJson[contact] = true;
            saveRecordToFile(recordJson);
            message.say("收到"+message.from()+"的报名");
        }else{
            message.say(message.from()+"已报名");
        }
    }else if(/\-+[1-9]+/.test(message.content())){
        if(recordJson[contact]){
            delete recordJson[contact];
            saveRecordToFile(recordJson);
            message.say("收到"+message.from()+"的取消报名");  
        }else{
            message.say(message.from()+"未报名");
        }
    }else if(/^统计$/.test(message.content())){
        message.say("报名人员:\n"+ JSON.stringify(recordJson)+"\n总人数:"+ Object.getOwnPropertyNames(recordJson).length);
    }
}

let saveRecordToFile =  function(jsonData){
    const contentJson = JSON.stringify(jsonData);
    fs.writeFile("./data/record.json", contentJson, 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 
}

let readRecordFromFile = function(){
    fs.readFile('./data/record.json', 'utf8', function (err, data) {
        if(err){
            recordJson = {};
        }else{
            recordJson = JSON.parse(data);
        }
    });
}

let initRecord = function(){
    readRecordFromFile();
}

Wechaty.instance() // Singleton
    .on('scan', (url, code) => console.log(`Scan QR Code to login: ${code}\n${url}`))

.on('login', user => console.log(`User ${user} logined`))

.on('message', message => callTuling(message))

.init();

let recordJson = {};
initRecord();
