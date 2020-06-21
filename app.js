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
var quizList = [];
var isWaitAns = false;
var users = {};
var sumOfStreak = 0;
var sumOfTry = 0;

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

    generateQuiz();

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

function generateQuiz() {
    quizList = [];
    //#region 최근 LCK 모스트픽 ox
    var mostList = [];
    mostList = fakerData.recentLCK.most;
    var quizO = `${fakerData.name}의 '${fakerData.recentLCK.name}' 모스트 픽은 '${mostList[0].champion}'이다.`;
    var quizX = `${fakerData.name}의 '${fakerData.recentLCK.name}' 모스트 픽은 '${mostList[2].champion}'이다.`;
    var info = `${fakerData.name}는 '${fakerData.recentLCK.name}'에서 '${mostList[0].champion}'을 가장 많이 플레이했습니다. (${mostList[0].played}게임)`;
    generateOX(quizO,quizX,info);
    //#endregion

    //#region 최근 LCK 승률 비교 ox
    var lckWinRate = fakerData.recentLCK.comparison_WinRate.split(' ')[0];
    var recentWinRate = fakerData.recentLCK.comparison_WinRate.split(' ')[1];
    if (lckWinRate < recentWinRate) {
        quizO = `${fakerData.name}의 '${fakerData.recentLCK.name}' 승률은 LCK 통산 승률보다 높다.`;
        quizX = `${fakerData.name}의 '${fakerData.recentLCK.name}' 승률은 LCK 통산 승률보다 낮다.`;
    } else {
        quizO = `${fakerData.name}의 '${fakerData.recentLCK.name}' 승률은 LCK 통산 승률보다 낮다.`;
        quizX = `${fakerData.name}의 '${fakerData.recentLCK.name}' 승률은 LCK 통산 승률보다 높다.`;
    }
    info = `${fakerData.recentLCK.name}' 승률 : ${recentWinRate}\nLCK 통산 승률 : ${lckWinRate}`;
    generateOX(quizO,quizX,info);
    //#endregion

    //#region 최근 LCK KDA 비교 ox
    var lckKDA = fakerData.recentLCK.comparison_KDA.split(' ')[0];
    var recentKDA = fakerData.recentLCK.comparison_KDA.split(' ')[1];
    if (lckKDA < recentKDA) {
        quizO = `${fakerData.name}의 '${fakerData.recentLCK.name}' KDA는 LCK 통산 KDA보다 높다.`;
        quizX = `${fakerData.name}의 '${fakerData.recentLCK.name}' KDA는 LCK 통산 KDA보다 낮다.`;
    } else {
        quizO = `${fakerData.name}의 '${fakerData.recentLCK.name}' KDA는 LCK 통산 KDA보다 낮다.`;
        quizX = `${fakerData.name}의 '${fakerData.recentLCK.name}' KDA는 LCK 통산 KDA보다 높다.`;
    }
    info = `${fakerData.recentLCK.name}' KDA : ${recentKDA}\nLCK 통산 KDA : ${lckKDA}`;
    generateOX(quizO,quizX,info);
    //#endregion

    //#region 최근 LCK 킬관여율 비교 ox
    var lckKP = fakerData.recentLCK.comparison_KP.split(' ')[0];
    var recentKP = fakerData.recentLCK.comparison_KP.split(' ')[1];
    if (lckKP < recentKP) {
        quizO = `${fakerData.name}의 '${fakerData.recentLCK.name}' 킬관여율은 LCK 통산 킬관여율보다 높다.`;
        quizX = `${fakerData.name}의 '${fakerData.recentLCK.name}' 킬관여율은 LCK 통산 킬관여율보다 낮다.`;
    } else {
        quizO = `${fakerData.name}의 '${fakerData.recentLCK.name}' 킬관여율은 LCK 통산 킬관여율보다 낮다.`;
        quizX = `${fakerData.name}의 '${fakerData.recentLCK.name}' 킬관여율은 LCK 통산 킬관여율보다 높다.`;
    }
    info = `${fakerData.recentLCK.name}' 킬관여율 : ${recentKP}\nLCK 통산 킬관여율 : ${lckKP}`;
    generateOX(quizO,quizX,info);
    //#endregion

    //#region LCK 통산 경기 수 퀴즈 ox
    var lckGames = fakerData.lCK.totalGamePlay * 1;
    quizO = `${fakerData.name}의 LCK 경기 수는 ${parseInt(lckGames/10)*10} 경기 이상이다.`;
    quizX = `${fakerData.name}의 LCK 경기 수는 ${parseInt(lckGames/10)*10 + 10} 경기 이상이다.`;
    info = `${fakerData.name}의 LCK 통산 경기 수 : ${lckGames}`;
    generateOX(quizO,quizX,info);
    //#endregion

    //#region LCK 경기당 킬 퀴즈 ox
    var lckKM = fakerData.lCK.killPerMatch * 1;
    quizO = `${fakerData.name}의 LCK 경기 당 킬은 ${parseInt(lckKM)} 킬 이상이다.`;
    quizX = `${fakerData.name}의 LCK 경기 당 킬은 ${parseInt(lckKM)+1} 킬 이상이다.`;
    info = `${fakerData.name}의 LCK 경기 당 킬 : ${lckKM}`;
    generateOX(quizO, quizX, info);
    //#endregion

    //#region LCK 경기당 데스 퀴즈 ox
    var lckDM = fakerData.lCK.deathPerMatch * 1;
    quizO = `${fakerData.name}의 LCK 경기 당 데스는 ${parseInt(lckDM)+1} 데스 이하이다.`;
    quizX = `${fakerData.name}의 LCK 경기 당 데스는 ${parseInt(lckDM)} 데스 이하이다.`;
    info = `${fakerData.name}의 LCK 경기 당 데스 : ${lckDM}`;
    generateOX(quizO, quizX, info);
    //#endregion

    //#region LCK KDA 퀴즈 ox
    var lckKDA = fakerData.lCK.kDA * 1;
    quizO = `${fakerData.name}의 LCK 통산 KDA는 ${(lckKDA + 0.2).toFixed(1)} 보다 높다.`;
    quizX = `${fakerData.name}의 LCK 통산 KDA는 ${(lckKDA - 0.2).toFixed(1)} 보다 높다.`;
    info = `${fakerData.name}의 LCK 통산 KDA : ${lckKDA}`;
    generateOX(quizO, quizX, info);
    //#endregion

    //#region LCK 킬관여율 퀴즈 ox
    var lckKP = fakerData.lCK.kP.replace('%','')*1;
    quizO = `${fakerData.name}의 LCK 통산 킬관여율은 ${parseInt(lckKP/10)*10}% 이상이다.`;
    quizX = `${fakerData.name}의 LCK 통산 킬관여율은 ${parseInt(lckKP/10)*10 + 10}% 이상이다.`;
    info = `${fakerData.name}의 LCK 통산 킬관여율 : ${lckKP}%`;
    generateOX(quizO, quizX, info);
    //#endregion

    //#region LCK 승률 퀴즈 ox
    var lckWR = fakerData.lCK.winRate.replace('%','')*1;
    quizO = `${fakerData.name}의 LCK 통산 승률은 ${parseInt(lckWR/10)*10}% 이상이다.`;
    quizX = `${fakerData.name}의 LCK 통산 승률은 ${parseInt(lckWR/10)*10 + 10}% 이상이다.`;
    info = `${fakerData.name}의 LCK 통산 승률 : ${lckWR}%`;
    generateOX(quizO, quizX, info);
    //#endregion

    //#region 챔피언 플레이 ox
    var champions = fakerData.champions;
    var champList = Object.keys(champions);
    var rareChampList = [];
    for (i = 0; i < champList.length; i++) {
        if (champions[champList[i]].totalGamePlay <= 2) {
            rareChampList.push(champions[champList[i]]);
        }
    }
    for (i = 0; i < 4; i++) {
        var champIndex = Math.floor(Math.random() * rareChampList.length);
        quizO = `${fakerData.name}는 대회에서 '${rareChampList[champIndex].name}'를 플레이한 적이 있다.`;
        quizX = `${fakerData.name}는 대회에서 '${rareChampList[champIndex].name}'를 플레이한 적이 없다.`;
        info = `'${rareChampList[champIndex].name}' : ${rareChampList[champIndex].totalGamePlay}게임, ${rareChampList[champIndex].totalWin}승, ${rareChampList[champIndex].kDA}KDA`;
        generateOX(quizO, quizX, info);
    
        champList.splice(champIndex,1);
    }
    //#endregion

    //#region 모스트 승률 챔피언
    var firstWinRateChamp = champions[champList[0]];
    var secondWinRateChamp = champions[champList[0]];
    for (i = 0; i < champList.length; i++) {
        if (champions[champList[i]].totalGamePlay >= 10) {
            if (champions[champList[i]].winRate > secondWinRateChamp.winRate) {
                secondWinRateChamp = champions[champList[i]];
                if (secondWinRateChamp.winRate > firstWinRateChamp.winRate) {
                    var temp = secondWinRateChamp;
                    secondWinRateChamp = firstWinRateChamp;
                    firstWinRateChamp = temp;
                }
            }
        }
    }
    quizO = `${fakerData.name}가 대회에서 플레이한 챔피언 중 가장 승률이 높은 챔피언은 '${firstWinRateChamp.name}'이다. (단, 10게임 이상)`;
    quizX = `${fakerData.name}가 대회에서 플레이한 챔피언 중 가장 승률이 높은 챔피언은 '${secondWinRateChamp.name}'이다. (단, 10게임 이상)`;
    info = `'${firstWinRateChamp.name}' : ${firstWinRateChamp.winRate}\n'${secondWinRateChamp.name}' : ${secondWinRateChamp.winRate}`;
    generateOX(quizO, quizX, info);
    //#endregion

    //#region 모스트 픽 챔피언
    var firstPickChamp = champions[champList[0]];
    var secondPickChamp = champions[champList[1]];
    
    quizO = `${fakerData.name}가 대회에서 가장 많이 플레이한 챔피언은 '${firstPickChamp.name}'이다. (단, 10게임 이상)`;
    quizX = `${fakerData.name}가 대회에서 가장 많이 플레이한 챔피언은 '${secondPickChamp.name}'이다. (단, 10게임 이상)`;
    info = `'${firstPickChamp.name}' : ${firstWinRateChamp.totalGamePlay}게임\n'${secondPickChamp.name}' : ${secondWinRateChamp.totalGamePlay}게임`;
    generateOX(quizO, quizX, info);
    //#endregion

    //#region 모스트 킬관여율 챔피언
    var firstKPChamp = champions[champList[0]];
    var secondKPChamp = champions[champList[0]];
    for (i = 0; i < champList.length; i++) {
        if (champions[champList[i]].totalGamePlay >= 10) {
            if (champions[champList[i]].kP > secondKPChamp.kP) {
                secondKPChamp = champions[champList[i]];
                if (secondKPChamp.kP > firstKPChamp.kP) {
                    var temp = secondKPChamp;
                    secondKPChamp = firstKPChamp;
                    firstKPChamp = temp;
                }
            }
        }
    }
    quizO = `${fakerData.name}가 대회에서 플레이한 챔피언 중 가장 킬관여율이 높은 챔피언은 '${firstKPChamp.name}'이다. (단, 10게임 이상)`;
    quizX = `${fakerData.name}가 대회에서 플레이한 챔피언 중 가장 킬관여율이 높은 챔피언은 '${secondKPChamp.name}'이다. (단, 10게임 이상)`;
    info = `'${firstKPChamp.name}' : ${firstKPChamp.kP}\n'${secondKPChamp.name}' : ${secondKPChamp.kP}`;
    generateOX(quizO, quizX, info);
    //#endregion
}

function generateOX(quizO, quizX, moreInfo) {
    quizList.push(
        {
            quiz: '[OX퀴즈] ' + quizO,
            ans: 'o',
            info: moreInfo
        }
    );
    quizList.push(
        {
            quiz: '[OX퀴즈] ' + quizX,
            ans: 'x',
            info: moreInfo
        }
    );
}

app.use(bodyParser.json());
app.post('/hook', async function (req, res) {
    var eventObj = req.body.events[0];
    var source = eventObj.source;
    var message = eventObj.message;

    // request log
    console.log('======================', new Date() ,'======================');
    console.log('[request]', req.body);
    console.log('[request source] ', eventObj.source);
    console.log('[request message]', eventObj.message);
    
    if (!isWaitAns && eventObj.message.text == '시작') {
        await checkData();
        users[eventObj.source.userId] = {
            streak: 0,
            quizAns: null,
            quizInfo: null
        };
        sendQuiz(eventObj.replyToken, eventObj.source.userId, true);
    } else if (isWaitAns) {
        if (checkAns(eventObj.source.userId, eventObj.message.text)) {
            users[eventObj.source.userId].streak++;
            sendQuiz(eventObj.replyToken, eventObj.source.userId, false);
        } else {
            endQuiz(eventObj.replyToken, eventObj.source.userId);
        }
    }

    res.sendStatus(200);
});

function sendQuiz(replyToken, id, isInit) {
    var randomQuiz = quizList[Math.floor(Math.random()*quizList.length)];
    var quizText = randomQuiz.quiz;
    var messages;
    users[id].quizAns = randomQuiz.ans;
    users[id].quizInfo = randomQuiz.info;

    if (isInit) {
        messages = [
            {
                "type":"text",
                "text":quizText
            }
        ];
    } else {
        messages = [
            {
                "type":"text",
                "text":'정답입니다.'
            },
            {
                "type":"text",
                "text":quizText
            }
        ];
    }
    request.post(
        {
            url: TARGET_URL,
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            },
            json: {
                "replyToken":replyToken,
                "messages": messages
            }
        },(error, response, body) => {
            console.log(body)
        }
    );

    isWaitAns = true;
}

function checkAns(id, ans) {
    if (ans.toUpperCase() == users[id].quizAns.toUpperCase()) {
        return true;
    } else {
        return false;
    }
}

function endQuiz(replyToken, id) {
    isWaitAns = false;
    sumOfTry++;
    sumOfStreak += users[id].streak;
    var averageStreak = sumOfStreak/sumOfTry;
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
                        "text":"오답입니다."
                    },
                    {
                        "type":"text",
                        "text":users[id].quizInfo
                    },
                    {
                        "type":"text",
                        "text":`${users[id].streak}문제 연속 정답!\n(유저 평균 : ${averageStreak.toFixed(1)}문제)`
                    },
                    {
                        "type":"text",
                        "text":"퀴즈를 다시 시작하려면 '시작'을 입력해주세요."
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