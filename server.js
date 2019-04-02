require('dotenv').config()
const express = require('express');
const fileupload = require('express-fileupload');
const app = express();
const path = require('path');
const mkdirp = require('mkdirp');
const jetpack = require('fs-jetpack');
const getCompsData = require('slo-league/src/liga/getCompsData');
const calcLiga = require('slo-league/src/liga/calcLiga');
//const renderPage = require('slo-league/src/page/render');
//import renderPage from '../node_modules/slo-league/src/page/render';
const fs = require('fs');
const _ = require('lodash');

const dataDir = process.env.DATA_STORAGE;
console.log('DATA_STORAGE=',dataDir)

const recalculateResults = (compsDir, outputDir, year) => {
  const compsData = getCompsData(compsDir);
  const ligaData = calcLiga(compsData);
  jetpack.write(path.join(outputDir, 'comps-'+year+'.json'), compsData);
  jetpack.write(path.join(outputDir, 'liga-'+year+'.json'), ligaData);
};

const readCompsResultsFromJSON = (dataDir, year) => {
  return JSON.parse(fs.readFileSync(path.join(dataDir, '/comps-'+year+'.json'), 'utf8'));
}

const readLigaResultsFromJSON = (dataDir, year) => {
  return JSON.parse(fs.readFileSync(path.join(dataDir, '/liga-'+year+'.json'), 'utf8'));
}

const render = (view, ctx = {}) => {
  return _.template(fs.readFileSync(`./${view}.html`))(ctx)
}

// get current year
const year = new Date().getFullYear();
    
mkdirp(path.join(dataDir, ''+year), function (err) {
    if (err) console.error(err)
    else console.log('Data directory created!')
});

app.use(fileupload());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/ligaadmin', (req, res) => {
  res.sendFile(path.join(__dirname + '/admin.html'));
});

app.get('/recalc/:year', (req, res) => {
  const year = req.params.year
  recalculateResults(path.join(dataDir, ''+year), dataDir, year);
  res.send('Recalculated '+year+'!');
});

app.get('/liga/:year', (req, res) => {
  const year = req.params.year
  const compsData = readCompsResultsFromJSON(dataDir, year)
  const ligaData = readLigaResultsFromJSON(dataDir, year)
  res.send(render("score", {year: year, compsData: compsData, ligaData: ligaData, numTasks: ligaData[0].allTasks.length, discardFrom: ligaData[0].allTasks.length - ligaData[0].discarded.length}))
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname + '/upload.html'));
});

app.post('/upload', (req, res) => {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let fsdbFile = req.files.fsdbFile;

  // Use the mv() method to place the file somewhere on your server
  fsdbFile.mv(path.join(dataDir, ''+year, fsdbFile.name), function(err) {
    if (err) return res.status(500).send(err);
    recalculateResults(path.join(dataDir, ''+year), dataDir, year);
    res.send('File uploaded!');
  });
});

// Port 5000 is the default Dokku application port
app.listen(5000, () => console.log('Listening on port 5000'));