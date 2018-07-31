const request = require('request');
const express = require('express');
const app = express();
const datastore = require('@google-cloud/datastore')();

const DATASTORE_KIND = 'Yurine';

const getEntities = async () => (await datastore.runQuery(datastore.createQuery(DATASTORE_KIND)))[0];
const getElapsedSeconds = (start) => (new Date() - start) / 1000;
const shouldKick = (entity) => !entity.lastKickedAt || getElapsedSeconds(entity.lastKickedAt) >= entity.intervalSeconds;

app.get('/', async (req, res) => {
    res.json(await getEntities());
});

app.get('/watch', async (req, res) => {
    let kicks = [];
    (await getEntities()).filter(shouldKick).forEach(entity => {
        request.get(entity.url);
        entity.lastKickedAt = new Date();
        datastore.save(entity);
        kicks.push(entity);
        console.log('Yurine kicked! ', entity.url, entity.lastKickedAt);
    });
    res.json(kicks);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`listening on 0.0.0.0:${PORT}...`);
});