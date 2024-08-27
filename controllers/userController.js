const User = require('../models/User');
const passport = require('passport');

exports.getLogin = (req, res) => {
  res.render('login', { user: req.user, error: req.flash('error') });
};

exports.postLogin = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
});

exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};
