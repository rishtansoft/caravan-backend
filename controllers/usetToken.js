const jwt = require('jsonwebtoken');

class UserToken {
    brancheToken({ reqdata }) {
        const role = jwt.verify(
            reqdata.headers.authorization.split(' ')[1],
            process.env.SECRET_KEY
        );


        return role
    }
}

module.exports = new UserToken();
