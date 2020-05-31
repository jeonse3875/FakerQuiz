const express = require('express');
const app = express();
const port = 80;

const axios = require('axios');
const cheerio = require('cheerio');
const url = 'http://lol.inven.co.kr/dataninfo/proteam/progamer.php?code=135';

var fakerData = {};

const getHTML = async () => {
    try {
        return await axios.get(url);
    } catch (error) {
        console.error(error);
    }
};

getHTML()
    .then(html => {
        const $ = cheerio.load(html.data);

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
            }
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

        return fakerData;
    })
    .then(res => console.log(res));

app.get('/', (req, res) => {
    res.send('Express Test');
});

app.listen(port, () => console.log(`app listening at http://localhost:${port}`));