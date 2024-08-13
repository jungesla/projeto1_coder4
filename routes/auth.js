const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../dao/models/User');

// Middleware para gerar JWT
const generateToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, 'seu_segredo_jwt_aqui', { expiresIn: '1h' });
};

// Rota de login
router.post('/login', async (req, res, next) => {
    passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({
                message: info ? info.message : 'Login falhou',
                user: user
            });
        }

        req.login(user, { session: false }, async (err) => {
            if (err) {
                return res.status(400).json({ message: err });
            }

            const token = generateToken(user);
            res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
            return res.json({ message: 'Login bem-sucedido', token });
        });
    })(req, res, next);
});

// Rota para obter informações do usuário atual usando JWT
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
