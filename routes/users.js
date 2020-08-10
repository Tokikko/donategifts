/*
    TODO: When redirected to index.html, Nav bar should change from 'sign up' to 'log out' and show 'my profile' also
*/

//NPM DEPENDENCIES
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

//IMPORT USER MODEL
const User = require('../models/User');

// Middleware for users 
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/users/login');
    } else {
        next();
    }
};
const redirectProfile = (req, res, next) => {
    if (req.session.userId) {
        res.redirect(`/users/profile`);
    } else {
        next();
    }
};

// @desc    Render (home)
// @route   GET '/users'
// @access  Public
// @tested 	Yes
router.get('/', (req, res) => {
    try {
        res.status(200).render('home', {user: res.locals.user}); 
    } catch (error) {
        res.status(400).send(JSON.stringify({
			success: false,
			error: err
		}));
    }
});

// @desc    Render signup.html
// @route   GET '/users/signup'
// @access  Public
// @tested 	Yes
router.get('/signup', redirectProfile, (req, res) => {
    try {
        res.status(200).render('signup', {user: res.locals.user});
    } catch (error) {
        res.status(400).send(JSON.stringify({
			success: false,
			error: err
		}));
    }
});

// @desc    
// @route   GET '/users/login'
// @access  Private
// @tested 	Not yet
router.get('/login', redirectProfile, (req, res) => {
    try {
        res.status(200).render('login', {user: res.locals.user});
    } catch (error) {
        res.status(400).send(JSON.stringify({
			success: false,
			error: err
		}));
    }
});

// @desc    Render profile.html, grabs userId and render ejs data in static template
// @route   GET '/users/profile'
// @access  Private, only users
// @tested 	Yes
// TODO: add conditions to check userRole and limit 'createWishCard' access to 'partners' only
router.get('/profile', redirectLogin, async (req, res) => {
    try {
		res.render('profile', {user: res.locals.user});
    } catch (err) {
        res.status(400).send(JSON.stringify({
			success: false,
			error: err
		}));
	}
});


// @desc    Create a newUser, hash password, issue session
// @route   POST '/users/signup'
// @access  Public
// @tested 	Yes
// TODO: display this message in signup.html client side as a notification alert
router.post('/signup', redirectProfile, async (req, res) => {
	const { fName, lName, email, password, userRole} = req.body;
	const candidate = await User.findOne({email: email});
	if (candidate) {
		return res.status(409).send('This email is already taken. Try another');
	} else {
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		const newUser = new User({
			fName,
			lName,
			email,
			password: hashedPassword,
			userRole
		});
		var userId = mongoose.Types.ObjectId(newUser._id);
		req.session.userId = userId;
		try {
			await newUser.save(); 
			return res.send('/users/profile'); 
		} catch (err) {
			console.log(err);
		}
	}
});

// @desc    Render login.html
// @route   POST '/users/login'
// @access  Public
// @tested 	Not yet
router.post('/login', redirectProfile, async (req, res) => {
    const { email, password } = req.body;
	const user = await User.findOne({ email: email });
	if (user) {
		if (await bcrypt.compare(password, user.password)) {
			req.session.userId = user.id;
			return res.redirect('/users/profile');
		}
	}
	res.redirect('/users/login');
});

// @desc    Render login.html
// @route   GET '/users/logout'
// @access  Public
// @tested 	Not yet
router.get('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
		res.clearCookie(process.env.SESS_NAME);
		res.redirect('/users/login');
	});
});

module.exports = router;