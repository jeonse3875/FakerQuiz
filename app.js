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

        // LCK 통산 전적
        var tr = $('table.table.log_list.log01 tbody').children();
        var td = tr.eq(0).children();
        fakerData['lCK'] = {
            totalGamePlay : td.eq(1).text(),
            totalWin : td.eq(2).text(),
            totalLose : td.eq(3).text(),
            winRate : td.eq(4).text(),
            killPerMatch : td.eq(5).text(),
            deathPerMatch : td.eq(6).text(),
            assistPerMatch : td.eq(7).text(),
            kDA : td.eq(8).text(),
            killParticipation : td.eq(9).text()
        };

        return fakerData;
    })
    .then(res => console.log(res));

app.get('/', (req, res) => {
    res.send('Express Test');
});

app.listen(port, () => console.log(`app listening at http://localhost:${port}`));