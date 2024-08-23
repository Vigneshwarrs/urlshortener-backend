const Url = require('../models/Url');
const crypto = require('crypto');

const generateShortUrl = () => {
    return crypto.randomBytes(5).toString('hex');
};

exports.shortenUrl = async (req, res) => {
    const { originalURL } = req.body;
    const user = req.user._id;
    console.log(user);
    try {
        // Check if the URL already exists for the user
        let url = await Url.findOne({ originalURL, user });
        if (!url) {
            // Generate a new short URL if it doesn't exist
            const shortURL = generateShortUrl();
            url = new Url({ originalURL, shortURL, user });
            await url.save();
        }
        return res.status(200).json({ shortUrl: `${url.shortURL}` });
    } catch (err) {
        console.error('Error shortening URL:', err);
        return res.status(500).json({ message: 'Server Error' });
    }
};

exports.redirectUrl = async (req, res) => {
    const { shortURL } = req.params;
    try {
        const url = await Url.findOne({ shortURL });
        if (!url) {
            return res.status(404).json({ message: 'URL not found' });
        }
        return res.redirect(301, url.originalURL);
    } catch (err) {
        console.error('Error redirecting URL:', err);
        return res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUserUrls = async (req, res) => {
    const userId = req.user._id;

    try {
        const urls = await Url.find({ user: userId }).select('originalURL shortURL');
        return res.status(200).json(urls);
    } catch (err) {
        console.error('Error retrieving user URLs:', err);
        return res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUrlStats = async (req, res) => {
    const userId = req.user._id;

    try {
        const totalUrlsPerDay = await Url.aggregate([
            { $match: { user: userId } },
            { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
            { $group: { _id: '$day', count: { $sum: 1 } } },
        ]);

        const totalUrlsPerMonth = await Url.aggregate([
            { $match: { user: userId } },
            { $project: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } } },
            { $group: { _id: '$month', count: { $sum: 1 } } },
        ]);

        return res.status(200).json({
            totalUrlsPerDay,
            totalUrlsPerMonth,
        });
    } catch (err) {
        console.error('Error retrieving URL stats:', err);
        return res.status(500).json({ message: 'Server Error' });
    }
};
