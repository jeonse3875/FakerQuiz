const express = require('express');
const app = express();
const port = 80;

app.get('/', (req, res) => {
    res.send('Express Test');
});

app.listen(port, () => console.log(`app listening at http://localhost:${port}`));