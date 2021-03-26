const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/users')
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var crypto = require('crypto');
var key = "password";
var algo = 'aes256';

const jwt = require('jsonwebtoken')
jwtkey = "jwt"
mongoose.connect("mongodb://localhost:27017/user-api", {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true


}).then(() => {
    console.log("coonection is successful");
}).catch((e) => {
    console.log("no connection");
})

app.post('/register', jsonParser, function (req, res) {
    var cipher = crypto.createCipher(algo, key);
    var encrypted = cipher.update(req.body.password, 'utf8', 'hex')
        + cipher.final('hex');
    console.warn(encrypted);
    const data = new User({
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        password: encrypted,
    })
    data.save().then((result) => {
        jwt.sign({ result }, jwtkey, { expiresIn: '300s' }, (err, token) => {
            res.status(201).json({ token })
        })
        // res.json(result);
    }).catch((err) => {
        console.warn(err);
    })
})
app.post('/login', jsonParser, function (req, res) {

    User.findOne({ email: req.body.email }).then((data) => {
        var decipher = crypto.createDecipher(algo, key);
        var decrypted = decipher.update(data.password, 'hex', 'utf8') +
            decipher.final('utf8');
        if (decrypted == req.body.password) {
            jwt.sign({ data }, jwtkey, { expiresIn: '300s' }, (err, token) => {
                res.status(200).json({ token })
            })
        }

    })

})
app.get('/users', verifytoken, function (req, res) {
    User.find().then((result) => {
        res.status(200).json(result)
    })
})

function verifytoken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
       

    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ')
        console.warn(bearer[1])
        req.token = bearer[1]
        jwt.verify(req.token, jwtkey, (err, authData) => {
            if (err) {
                res.json({ result: err })
            } else {
                next();
            }
        })
    }
    else {
        res.send({ "result": "token not provided" })
    }
}
app.listen(5000);