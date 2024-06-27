const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const rateLimit = require('express-rate-limit');
require('dotenv').config()

const routes = require('./routes');

const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // X - 15m - 60s - 1000ms
  max: 10, // Usuario pode realizar 10 requisicoes em X minutos
  message: {
    status: "error",
    message: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(limiter);
app.use('/api/v1', routes);

app.get('/', (_, res) => {
  res.status(200);
  res.send({ "status": "success" });
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;