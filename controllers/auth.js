const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/emailService');
const crypto = require('crypto');

const generateToken = (user)=>{
    return jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

exports.registerUser = async (req, res)=> {
    try{
        const { name, username, password } = req.body;

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }
        // Create a new user
        const user = new User({ name, username, password });
        
        // Generate a unique activation code
        const activationToken = crypto.randomBytes(32).toString('hex');
        user.activationToken = activationToken;
        await user.save();

        //Send a Activation link
        await sendMail({
            to: user.username,
            subject: 'Account Activation',
            message: `Please activate your account by clicking on the following link: http://localhost:5000/api/auth/activate/${activationToken}`
        });
        const accessToken = generateToken(user);
        
        res.status(201).json({ user, accessToken, msg: 'User registered. Please check your email to activate your account.' });
    }catch(err){
        console.error('Registration Error',err);
        res.status(500).json({ message: 'Server error.' });
    }
}

exports.activateUser = async (req, res)=> {
    try{
        const { activationToken } = req.params;
        
        // Check if activation code is valid
        const user = await User.findOne({ activationToken });
        if (!user) {
            return res.status(404).json({ message: 'Invalid activation code.' });
        }
        
        // Activate the user
        user.isActive = true;
        user.activationToken = null;
        await user.save();
        
        res.status(200).json({ message: 'Account activated successfully.' });
    }catch(err){
        console.error('Activation Error',err);
        res.status(500).json({ message: 'Server error.' });
    }
}

exports.loginUser = async (req, res)=> {
    try{
        const { username, password } = req.body;

        // Check if the user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Password.' });
        }
        
        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account not activated. Please check your email for the activation link.' });
        }
        
        const token = generateToken(user);
        res.status(200).json({ user, token, msg: 'Logged in successfully.' });
    }catch(err){
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
}

exports.forgotPassword = async (req, res)=> {
    try{
        const { username } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // Generate a reset code
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Save reset code to the user
        user.passwordResetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 600000; // 10 min
        await user.save();
        
        // Send a password reset link
        await sendMail({
            to: user.username,
            subject: 'Password Reset',
            message: `Please reset your password by clicking on the following link: http://localhost:3000/reset-password/${resetToken}`
        });
        
        res.status(200).json({ message: 'Password reset link sent to your email.' });
    }catch(err){
        console.error('Forget password error', err);
        res.status(500).json({ message: 'Server error.' });
    }
}

exports.resetPassword = async (req, res)=> {
    try{
        const { resetToken } = req.params;
        const { password } = req.body;
        
        // Check if reset token is valid
        const user = await User.findOne({ passwordResetToken: resetToken, resetTokenExpiration: { $gt: Date.now() } });
        if (!user) {
            return res.status(404).json({ message: 'Invalid reset token.' });
        }
        
        // Reset the password
        user.password = password;
        user.passwordResetToken = null;
        user.resetTokenExpiration = null;
        await user.save();
        
        res.status(200).json({ message: 'Password reset successfully.' });
    }catch(err){
        console.error('Reset password error', err);
        res.status(500).json({ message: 'Server error.' });
    }
}