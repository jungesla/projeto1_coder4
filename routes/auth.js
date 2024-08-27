const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Usuário não encontrado.');
      return res.redirect('/');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Senha incorreta.');
      return res.redirect('/');
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Erro ao realizar login');
        return res.redirect('/');
      }
      res.redirect('/products');
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Erro no servidor.');
    res.redirect('/');
  }
});

module.exports = router;

