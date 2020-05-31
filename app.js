const express = require('express');
const app = express();
const port = 80;

const axios = require('axios');
const cheerio = require('cheerio');

const getHTML = async () => {
    try {
        return await axios.get('http://lol.inven.co.kr/dataninfo/proteam/progamer.php?code=135');
    } catch (error) {
        console.error(error);
    }
};

getHTML()
    .then(html => {
        const $ = cheerio.load(html.data);
        var title = $("h2.block.name").text();

        return title;
    })
    .then(res => console.log(res));

app.get('/', (req, res) => {
    res.send('Express Test');
});

app.listen(port, () => console.log(`app listening at http://localhost:${port}`));