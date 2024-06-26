const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
require('dotenv').config()

const routes = require('./routes');

const PORT = process.env.PORT || 3001;

const allowedOrigins = ['https://prod-tcc-bank.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed'));
    }
  },
  methods: 'GET,POST',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  credentials: true,
  optionsSuccessStatus: 200
};

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api/v1', routes);

app.get('/', (_, res) => {
  res.status(200);
  res.send({ "status": "success" });
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;