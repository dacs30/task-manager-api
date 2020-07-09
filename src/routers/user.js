const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const {sendWelcomeEmail, sendCancelEmail} = require('../emails/account');
const router = new express.Router();    


// sign up a user 
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name); // send email when the user is created
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send(e);
    }
});

// loggin a user 
router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (e) {
        res.status(400).send();
    }
})

// logging out the user (must be logged in)
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token; // the token we are looking at isnt the one we are using
        });
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

// loggin out all users
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []; // emptying the tokens array 
        await req.user.save();
        res.status(200).send();
    } catch (e) {
        res.status(500).send();
    }
})

// showing the user profile 
// with middleware before our function, so gets the token
router.get('/users/me', auth,  async (req, res) => {
    res.send(req.user);
})

// updating the logged user
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid update!'})
    }

    try {
        // the next three lines are required because of the hashing process

        updates.forEach((update) => req.user[update] = req.body[update]); // for each thing that will be updated

        await req.user.save();

        res.send(req.user);

    } catch (e) {
        res.status(400).send(e);
    }
})

// deleting the user logged in (using auth to get the user)
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelEmail(req.user.email, req.user.name);
        res.send(req.user);

    } catch (e) {
        res.status(500).send();
    }
});

// upload a profile picture using multer
const upload = multer({ // destination directory
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)){ // using regular expression to check the file type
            return cb(new Error('Please, upload a image in jpg, jpeg or png'));
        }

        cb(undefined, true);
        // some examples of callback
        // cb(new Error('File type not supported'));
        // cb(undefined, true);
        // cb(undefined, false);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer(); // resize and convert the picture
    req.user.avatar = buffer; // saving this image into a new field inside user
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error: error.message}); // error return
});

// deleting a profile picture when the user is logged in
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

// send the user profile pic
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(400).send(); 
    }
})

module.exports = router;