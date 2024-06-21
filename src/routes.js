const express = require('express');
const multer = require('multer');

const { login, register, getUser, uploadUserDocument, updateUserImage, createLimitIncreaseRequest, getUserRequests, reviewRequest } = require('./controller/users');
const checkBearerToken = require('../middleware/check-token');
const { getInvestmentComments, getInvestments, createInvestmentComment } = require('./controller/investment');

const routes = express.Router();

const upload = multer({ dest: 'uploads/' });

routes.post('/account/login', login);
routes.post('/account/register', register);
routes.get('/account/', checkBearerToken, getUser);
routes.post('/upload-document', checkBearerToken, upload.single('document'), uploadUserDocument);
routes.post('/upload-image', checkBearerToken, updateUserImage);

routes.get('/limit/request', checkBearerToken, getUserRequests);
routes.post('/limit/request/review', checkBearerToken, reviewRequest);
routes.post('/limit/request', checkBearerToken, createLimitIncreaseRequest);

routes.get('/investment', checkBearerToken, getInvestments);
routes.get('/investment/comment', checkBearerToken, getInvestmentComments);
routes.post('/investment/comment', checkBearerToken, createInvestmentComment);

module.exports = routes;