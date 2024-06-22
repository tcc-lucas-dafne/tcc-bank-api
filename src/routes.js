const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const { login, register, getUser, updateUserImage, createLimitIncreaseRequest, getUserRequests, reviewRequest, uploadFile, getFile } = require('./controller/users');
const checkBearerToken = require('../middleware/check-token');
const { getInvestmentComments, getInvestments, createInvestmentComment } = require('./controller/investment');
const { SECRET } = require('./constants');

const routes = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const { authorization } = req.headers;

    const token = authorization.split(' ')[1];

    const decoded = jwt.decode(token, SECRET);

    if (!decoded.account_id) throw Error('Invalid token');

    const dynamicFileName = `user_${decoded.account_id}_document.pdf`;

    cb(null, dynamicFileName); // Use the dynamic filename provided in the request
  }
});

const uploadStorage = multer({ dest: 'uploads/documents', storage: storage });

routes.post('/account/login', login);
routes.post('/account/register', register);
routes.get('/account/', checkBearerToken, getUser);

routes.post('/upload/image', checkBearerToken, updateUserImage);

routes.get('/upload/document', checkBearerToken, getFile);
routes.post('/upload/document', checkBearerToken, uploadStorage.single('file'), uploadFile);

routes.get('/limit/request', checkBearerToken, getUserRequests);
routes.post('/limit/request/review', checkBearerToken, reviewRequest);
routes.post('/limit/request', checkBearerToken, createLimitIncreaseRequest);

routes.get('/investment', checkBearerToken, getInvestments);
routes.get('/investment/comment', checkBearerToken, getInvestmentComments);
routes.post('/investment/comment', checkBearerToken, createInvestmentComment);

module.exports = routes;