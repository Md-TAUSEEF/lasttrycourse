const jwt = require("jsonwebtoken");
const User = require("../Modules/User_module");
const ErrorResponse = require("../Utils/ErrorHandlear");

const authmiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return next(new ErrorResponse("User is not logged in. Please log in.", 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded._id);

        if (!req.user) {
            return next(new ErrorResponse("User not found. Please log in again.", 401));
        }

        next();
    } catch (error) {
        next(new ErrorResponse("Authentication error.", 500));
    }
}



//<================checkthis is admin==================>//

const Authenticatedadmin = (req, res, next) => {
   
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ msg: "This user is not an admin." });
        }

        next();
    } catch (error) {
        next(new ErrorResponse("Authorization error.", 500));
    }
};

const AuthentiSubscription = (req, res, next) => {
    try {
        if (!req.user) {
            return next(new ErrorResponse("User not authenticated.", 401));
        }

        if (req.user.subscription.status !== "active" && req.user.role !== "admin") {
            return next(new ErrorResponse("Subscription required to access this resource.", 403));
        }

        next();
    } catch (error) {
        next(new ErrorResponse("Authorization error.", 500));
    }
};

module.exports = {Authenticatedadmin,AuthentiSubscription, authmiddleware};
