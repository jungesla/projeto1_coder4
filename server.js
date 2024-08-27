const express = require('express');
const session = require('express-session');
const passport = require('passport');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartsRoutes = require('./routes/carts');
const { mongodbUri, port, sessionSecret } = require('./config/config');
require('./config/passport'); 

const app = express();

app.use(express.urlencoded({ extended: false }));

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.handlebars'
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

mongoose.connect(mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.get('/', (req, res) => {
  res.render('login', { message: req.flash('error') });
});

app.use('/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/carts', cartsRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
