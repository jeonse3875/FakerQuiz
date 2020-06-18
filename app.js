const fs = require('fs');
const express = require('express');
const app = express();
const port = 80;

const axios = require('axios');
const cheerio = require('cheerio');
const url = 'http://lol.inven.co.kr/dataninfo/proteam/progamer.php?code=135';

const request = require('request');
const TARGET_URL = 'https://api.line.me/v2/bot/message/reply';
const TOKEN = 'ihoYpWsdObaqmCnQ7nqwBfSGiLV4v3OZSqccIK9osz9y9pOMiKgEpmJ8fHiiBT0rF5wZoa2bRGTQjZ7al4yseviaYPsROO4nyiygZi8lvW2xcD6yakxXZ91eNmzz8e6fQ32IPZ577Iagx/kEQ/UMgAdB04t89/1O/w1cDnyilFU=';
const path = require('path');
const HTTPS = require('https');
const domain = "www.sekechatbot.tk"
const sslport = 23023;
const bodyParser = require('body-parser');

const version = '0.1';
const dataFileName = 'data.json';

var fakerData = {};

async function checkData() {
    try {
        if (fakerData.version == version) {
            console.log("이미 데이터가 존재합니다.");

            var today = new Date();
            var dateInfo = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
            if (fakerData.date != dateInfo)
            {
                console.log("오래된 데이터입니다. 데이터를 크롤링합니다.");
                await getData();
            }
        }
        else if (fakerData.version == undefined) {
            const dataBuffer = fs.readFileSync(dataFileName);
            console.log("데이터를 읽습니다.");
            fakerData = JSON.parse(dataBuffer.toString());
            console.log(fakerData);
        }
        else {
            console.log("버전이 다릅니다. 데이터를 크롤링합니다.");
            await getData();
        }
    }
    catch (exception) {
        if (exception.code == "ENOENT") {
            console.log("데이터 파일이 존재하지 않습니다. 데이터를 크롤링합니다.");
            await getData();
        }
        else {
            console.log(exception);
        }
    }

    return new Promise(function (resolve, reject) {
        resolve();
    });
}

async function getHTML() {
    try {
        return axios.get(url);
    } catch (error) {
        console.error(error);
        return null;
    }
};

async function getData() {
    const html = await getHTML();
    if (html == null) {
        return;
    }

    fakerData['version'] = version;

    var today = new Date();
    var dateInfo = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    fakerData['date'] = dateInfo;

    const $ = cheerio.load(html.data);

    var playerName = $('div#lolMain h2.block.name').text().split(' ');
    fakerData['name'] = playerName[playerName.length - 1];

    //#region LCK 통산 전적
    var tr = $('table.table.log_list.log01 tbody').children();
    var td = tr.eq(0).children();

    fakerData['lCK'] = {
        totalGamePlay: td.eq(1).text(),
        totalWin: td.eq(2).text(),
        totalLose: td.eq(3).text(),
        winRate: td.eq(4).text(),
        killPerMatch: td.eq(5).text(),
        deathPerMatch: td.eq(6).text(),
        assistPerMatch: td.eq(7).text(),
        kDA: td.eq(8).text(),
        kP: td.eq(9).text()
    };
    //#endregion

    //#region 최근 LCK 기록
    var recentLCKInfo = $('div.block.scriptorium_box.scriptorium_player_info').children().eq(2);
    var mostInfo = recentLCKInfo.find('div.left ul.block.list').children();
    var mostList = [];
    var indicatorInfo = recentLCKInfo.find('div.right ul.block.bottom.clearfix').children();

    mostInfo.each(function (i, elem) {
        mostList[i] = {
            champion: $(this).find('div.name_area p.value b').text(),
            played: $(this).find('div.play_area p.value').text(),
            record: $(this).find('div.log_area p.value').text(),
            kDA: $(this).find('div.kda_area p.value').text()
        };
    });

    fakerData['recentLCK'] = {
        name: recentLCKInfo.find('h3.block.player_sub_title.clearfix').text(),
        most: mostList,
        comparison_WinRate: indicatorInfo.eq(0).find('div.progress.left div.text').text()
            .concat(" ", indicatorInfo.eq(0).find('div.progress.right div.text').text()),
        comparison_KDA: indicatorInfo.eq(1).find('div.progress.left div.text').text()
            .concat(" ", indicatorInfo.eq(1).find('div.progress.right div.text').text()),
        comparison_KP: indicatorInfo.eq(2).find('div.progress.left div.text').text()
            .concat(" ", indicatorInfo.eq(2).find('div.progress.right div.text').text())
    };
    //#endregion

    //#region 통산 전적
    var td = $('div.scriptorium').children('div.listTable').eq(1).find('table tbody tr').children();

    fakerData['fullCareer'] = {
        totalGamePlay: td.eq(0).text(),
        totalWin: td.eq(1).text(),
        totalLose: td.eq(2).text(),
        winRate: td.eq(3).text(),
        totalKill: td.eq(4).text(),
        totalDeath: td.eq(5).text(),
        totalAssist: td.eq(6).text(),
        killPerMatch: td.eq(7).text(),
        deathPerMatch: td.eq(8).text(),
        assistPerMatch: td.eq(9).text(),
        kDA: td.eq(10).text(),
        kP: td.eq(11).text()
    }
    //#endregion

    //#region 대회 별 전적
    var tr = $('div.scriptorium').children('div.listTable').eq(3).find('table tbody').children();
    var competitionData = {};

    tr.each(function (i, elem) {
        var td = $(this).children();
        var competitionName = td.eq(0).text().replace(td.eq(0).find('span').text(), '');

        competitionData[competitionName] = {
            name: competitionName,
            totalGamePlay: td.eq(1).text(),
            totalWin: td.eq(2).text(),
            totalLose: td.eq(3).text(),
            winRate: td.eq(4).text(),
            totalKill: td.eq(5).text(),
            totalDeath: td.eq(6).text(),
            totalAssist: td.eq(7).text(),
            killPerMatch: td.eq(8).text(),
            deathPerMatch: td.eq(9).text(),
            assistPerMatch: td.eq(10).text(),
            kDA: td.eq(11).text(),
            kP: td.eq(12).text()
        };
    });

    fakerData['competitions'] = competitionData;
    //#endregion

    //#region 챔피언 별 전적
    var tr = $('div.scriptorium').children('div.listTable').eq(4).find('table tbody').children();
    var championData = {};

    tr.each(function (i, elem) {
        var td = $(this).children();
        var championName = td.eq(0).text();

        championData[championName] = {
            name: championName,
            totalGamePlay: td.eq(1).text(),
            totalWin: td.eq(2).text(),
            totalLose: td.eq(3).text(),
            winRate: td.eq(4).text(),
            totalKill: td.eq(5).text(),
            totalDeath: td.eq(6).text(),
            totalAssist: td.eq(7).text(),
            killPerMatch: td.eq(8).text(),
            deathPerMatch: td.eq(9).text(),
            assistPerMatch: td.eq(10).text(),
            kDA: td.eq(11).text(),
            kP: td.eq(12).text()
        }
    });

    fakerData['champions'] = championData;
    //#endregion

    console.log(fakerData);
    fs.writeFileSync(dataFileName, JSON.stringify(fakerData));

    return new Promise(function (resolve, reject) {
        resolve();
    });
}

app.use(bodyParser.json());
app.post('/hook', function (req, res) {
    var eventObj = req.body.events[0];
    var source = eventObj.source;
    var message = eventObj.message;

    // request log
    console.log('======================', new Date() ,'======================');
    console.log('[request]', req.body);
    console.log('[request source] ', eventObj.source);
    console.log('[request message]', eventObj.message);
    
    sendMessage(eventObj.replyToken, eventObj.message.text);

    res.sendStatus(200);
});

function sendMessage(replyToken, message) {
    request.post(
        {
            url: TARGET_URL,
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            },
            json: {
                "replyToken":replyToken,
                "messages":[
                    {
                        "type":"text",
                        "text":"test"
                    }
                ]
            }
        },(error, response, body) => {
            console.log(body)
        }
    );
}

try {
    const option = {
      ca: fs.readFileSync('/etc/letsencrypt/live/' + domain +'/fullchain.pem'),
      key: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain +'/privkey.pem'), 'utf8').toString(),
      cert: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain +'/cert.pem'), 'utf8').toString(),
    };
  
    HTTPS.createServer(option, app).listen(sslport, () => {
      console.log(`[HTTPS] Server is started on port ${sslport}`);
    });
  } catch (error) {
    console.log('[HTTPS] HTTPS 오류가 발생하였습니다. HTTPS 서버는 실행되지 않습니다.');
    console.log(error);
  }