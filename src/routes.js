const express = require('express');

const { login, register, getUser } = require('./controller/users');

const routes = express.Router();

routes.post('/user/login', login);
routes.post('/user/register', register);
routes.get('/user/', getUser);

module.exports = routes;