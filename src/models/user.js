const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true, // now the email is unique. No accounts with the same email
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid'); // using validator to to check the email
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes('password')){ // check if password is not the word password
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0){
                throw new Error('Age must be positive');
            }
        }
    },
    tokens: [{ // keeping in track of the tokens
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer // profile picture
    }
}, {
    timestamps: true // keep in track of the creation and update
});

// Virtual property for the tasks of the user (owner)
// check the task model to understand more how this relation user/task is working
// I do have to study more about this*
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

// public profile is what we want the user to see
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    // deleting the fields that we don't want to return in this user obj copy
    delete userObject.password; 
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

// generating tokens for users
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET); // jwt secret in env

    user.tokens = user.tokens.concat({token});

    await user.save();

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});

    if (!user) {
        throw new Error('Unable to login. Try again later.');
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch){
        throw new Error('Unable to login. Try again later.')
    }

    return user;
}


// this part is super important
// Hash the plain test password before saving it
userSchema.pre('save', async function (next) {
    const user = this;

    if(user.isModified('password')) { // checking if the password is being modified (also checks when is created)
        user.password = await bcrypt.hash(user.password, 8);
    }

    next(); // next must be called!
});

// Delete user tasks when the user is removed
userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({owner: user._id}) // yeah, it is async
    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;