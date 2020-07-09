const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // env jwt
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token}); // find the correct user

        if (!user){
            throw new Error()
        }

        req.token = token; // router will have access to the token
        req.user = user;
        next();

    } catch (e) {
        res.status(401).send({error: 'Please authenticate.'}) // in case you are not logged
    }
}

module.exports = auth;