const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, Dokku!');
});

// Port 5000 is the default Dokku application port
app.listen(5000, () => console.log('Listening on port 5000'));