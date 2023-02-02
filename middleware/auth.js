const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const errorResponse = require('../utils/ErrorHandler')
const User = require('../modals/users');

exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorisation && req.headers.authorisation.startsWith('Bearer')) {
        token = req.headers.authorisation.split(' ')[1];
    }
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        next(new errorResponse('Not authorize to access the route', 401))
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id, password: decoded.password }).select('+password')


        if (user) {
            req.user = user;
        }
        if (!user) {
            next(new errorResponse('Not authorize to access the route', 401))
        }
        next();

    } catch (err) {

        next(new errorResponse('Not authorize to access the route', 401))
    }
})


exports.authorisation = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new errorResponse('Not authorized to access the route', 404));
        }
        next();
    }

}