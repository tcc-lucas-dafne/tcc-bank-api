const express = require('express');
const multer = require('multer');

const { login, register, getUser, uploadUserDocument, updateUserImage, createLimitIncreaseRequest } = require('./controller/users');
const checkBearerToken = require('../middleware/check-token');

const routes = express.Router();

const upload = multer({ dest: 'uploads/' });

routes.post('/account/login', login);
routes.post('/account/register', register);
routes.get('/account/', checkBearerToken, getUser);
routes.post('/upload-document', checkBearerToken, upload.single('document'), uploadUserDocument);
routes.post('/upload-image', checkBearerToken, updateUserImage);
routes.post('/limit/request', checkBearerToken, createLimitIncreaseRequest);

module.exports = routes;