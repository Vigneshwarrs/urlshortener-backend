const express = require('express');
const routes = express.Router();
const {registerUser, activateUser, loginUser, forgotPassword, resetPassword} = require('../controllers/auth');

// register user route
routes.post('/register', registerUser);

// Activate user route
routes.get('/activate/:activationToken', activateUser);

// Login user route
routes.post('/login', loginUser);

//Forgot password route
routes.post('/forgot-password', forgotPassword);

// Reset password route
routes.post('/reset-password/:resetToken', resetPassword);

module.exports = routes;