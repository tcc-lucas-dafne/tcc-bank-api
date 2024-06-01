const express = require('express');

const { login, register, getUser } = require('./controller/users');

const routes = express.Router();

routes.post('/account/login', login);
routes.post('/account/register', register);
routes.get('/account/', getUser);

module.exports = routes;