const express = require('express');
const multer = require('multer');

const { login, register, getUser, uploadUserDocument, updateUserImage } = require('./controller/users');

const routes = express.Router();

const upload = multer({ dest: 'uploads/' });

routes.post('/account/login', login);
routes.post('/account/register', register);
routes.get('/account/', getUser);
routes.post('/upload-document', upload.single('document'), uploadUserDocument);
routes.post('/upload-image', updateUserImage);

module.exports = routes;