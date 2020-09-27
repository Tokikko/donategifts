//NPM DEPENDENCIES
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

//IMPORT USER MODEL
const User = require('../models/User');

//IMPORT AGENCY MODEL
const Agency = require('../models/Agency');

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
		res.status(200).render('home', {
			user: res.locals.user
		});
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
		res.status(200).render('signup', {
			user: res.locals.user
		});
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
// @tested 	yes
router.get('/login', redirectProfile, (req, res) => {
	try {
		res.status(200).render('login', {
			user: res.locals.user
		});
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
		res.render('profile', {
			user: res.locals.user
		});
	} catch (err) {
		res.status(400).send(JSON.stringify({
			success: false,
			error: err
		}));
	}
});

// @desc    Update user about me info
// @route   PUT '/users/profile'
// @access  Private, only users
// @tested 	No?
router.put('/profile', async (req, res) => {
	try {
        const {aboutMe} = req.body;
        console.log("1")
        // if no user id is present return forbidden status 403
        if (!req.session.userId) {
            res.status(403).send(JSON.stringify({
                success: false,
                error: "No user id in request"
            }));
        }

        const candidate = await User.findOne({_id: req.session.userId});

        // candidate with id not found in database, return not found status 404
        if (!candidate) {
            res.status(404).send(JSON.stringify({
                success: false,
                error: "User could not be found"
            }));
        }
        
        // update user and add aboutMe
        User.updateOne(
            {_id: candidate._id}, 
            {aboutMe : aboutMe },
            {multi:true}, 
              function(err, numberAffected){  
              });

        res.status(200).send(JSON.stringify({
            success: true,
            error: null,
            data: aboutMe,
        }));

	} catch (err) {
		res.status(400).send(JSON.stringify({
			success: false,
			error: err
		}));
	}
});


// @desc    Render agency.ejs
// @route   GET '/users/agency'
// @access  Private, only userRole == partners
// @tested 	No
router.get('/agency', redirectLogin, async (req, res) => {
	try {
		res.render('agency', {
			user: res.locals.user
		});
	} catch (err) {
		res.status(400).send(JSON.stringify({
			success: false,
			error: err
		}));
	}
});


// @desc    agency info is sent to db
// @route   POST '/users/agency'
// @access  private, partners only
// @tested 	No
router.post('/agency', async (req, res) => {
	const {
		agencyName,
		agencyWebsite,
		agencyPhone,
		agencyBio
	} = req.body;

	const newAgency = new Agency({
		agencyName,
		agencyWebsite,
		agencyPhone,
		agencyBio
	});
	try {
		await newAgency.save();
		console.log("agency data saved");
		return res.send('/users/profile');
	} catch (err) {
		console.log(err);
	}
});


// @desc    Create a newUser, hash password, issue session
// @route   POST '/users/signup'
// @access  Public
// @tested 	Yes
// TODO: display this message in signup.html client side as a notification alert
router.post('/signup', redirectProfile, async (req, res) => {
	const {
		fName,
		lName,
		email,
		password,
		userRole
	} = req.body;
	const candidate = await User.findOne({
		email: email
	});
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
			//trying to add a second step here
			//if the userRole is partner then redirect to agency.ejs then profile.ejs
			if (newUser.userRole == 'partner') {
				return res.send('/users/agency');
			} else {
				return res.send('/users/profile');
			}
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
	const {
		email,
		password
	} = req.body;
	const user = await User.findOne({
		email: email
	});
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