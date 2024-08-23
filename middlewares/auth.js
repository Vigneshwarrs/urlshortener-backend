const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user by ID and ensure the user exists
            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found. Access denied.' });
            }

            // Attach the user to the request object
            req.user = user;

            next();
        } catch (err) {
            console.error('Token verification failed:', err);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please log in again.' });
            } else {
                return res.status(403).json({ message: 'Access denied. Invalid token.' });
            }
        }
    } else {
        // If no token was provided
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
};

module.exports = protect;
