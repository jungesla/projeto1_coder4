const express = require('express');
const path = require('path');
const http = require('http');
const flash = require('connect-flash');
const socketIo = require('socket.io');
const { engine } = require('express-handlebars');
const Handlebars = require('handlebars');
const mongoose = require('mongoose');
const connectDB = require('./dao/db');
const Product = require('./dao/models/Product');
const Cart = require('./dao/models/Cart');
const Message = require('./dao/models/Message');
const handlebarsLayouts = require('handlebars-layouts');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const config = require('./config');
const passport = require('./config/passport'); // Certifique-se de que o caminho esteja correto
const cookieParser = require('cookie-parser');

mongoose.set('strictQuery', true);
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(flash());
app.use(passport.initialize());  // Inicializa o Passport.js

app.engine('handlebars', engine({
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    defaultLayout: 'main',
    extname: '.handlebars',
    helpers: handlebarsLayouts(Handlebars),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware para proteger rotas com JWT
const checkAuthenticated = passport.authenticate('jwt', { session: false });

const checkAdmin = (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }
    res.redirect('/products');
};

// Rotas de autenticação
app.use('/auth', require('./routes/auth'));

app.get('/register', (req, res) => {
    res.render('register'); // Renderiza o template register.handlebars
});

app.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body;
    if (!email || !password || !first_name || !last_name || !age) {
        req.flash('error_msg', 'Por favor, preencha todos os campos');
        return res.redirect('/register');
    }
    try {
        const user = await User.findOne({ email });
        if (user) {
            req.flash('error_msg', 'Email já registrado');
            return res.redirect('/register');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ first_name, last_name, email, age, password: hashedPassword });
        await newUser.save();
        req.flash('success_msg', 'Você está registrado e pode fazer login');
        res.redirect('/login');
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        req.flash('error_msg', 'Erro ao registrar usuário');
        res.redirect('/register');
    }
});


app.get('/login', (req, res) => {
    res.render('login'); // Renderiza o template login.handlebars
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error_msg', 'Por favor, preencha todos os campos');
        return res.redirect('/login');
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Email não registrado');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Senha incorreta');
            return res.redirect('/login');
        }

        // Se a autenticação for bem-sucedida
        req.session.user = user;
        res.redirect('/produtos');

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        req.flash('error_msg', 'Erro ao fazer login');
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login');
});

io.on('connection', (socket) => {
    console.log('Novo cliente conectado');
    socket.on('message', async (data) => {
        const newMessage = new Message(data);
        await newMessage.save();
        io.emit('message', data);
    });

    socket.on('addToCart', async (data) => {
        try {
            const cart = await Cart.findOne({ userId: 'some_user_id' });
            if (!cart) {
                const newCart = new Cart({
                    userId: 'some_user_id',
                    products: [{ productId: data.productId, quantity: data.quantity }]
                });
                await newCart.save();
            } else {
                const productIndex = cart.products.findIndex(p => p.productId.toString() === data.productId);
                if (productIndex !== -1) {
                    cart.products[productIndex].quantity += data.quantity;
                } else {
                    cart.products.push({ productId: data.productId, quantity: data.quantity });
                }
                await cart.save();
            }
            io.emit('cartUpdated', { status: 'sucesso', message: 'Produto adicionado ao carrinho' });
        } catch (error) {
            console.error('Erro ao adicionar produto ao carrinho:', error);
            io.emit('cartUpdated', { status: 'erro', message: 'Erro ao adicionar produto ao carrinho' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

app.get('/chat', checkAuthenticated, (req, res) => {
    res.render('chat');
});

app.get('/products', checkAuthenticated, async (req, res) => {
    try {
        let { limit = 10, page = 1, sort, query } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);

        const filters = query ? { $or: [{ category: query }, { status: query }] } : {};
        const sortOption = sort ? { price: sort === 'asc' ? 1 : -1 } : {};

        const products = await Product.find(filters)
            .sort(sortOption)
            .limit(limit)
            .skip((page - 1) * limit);

        const totalProducts = await Product.countDocuments(filters);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('products', {
            products,
            totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
            page,
            limit,
            sort,
            query,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            user: req.user,  
            welcomeMessage: `Bem-vindo ${req.user.email}!`,
        });
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ status: 'erro', message: 'Erro interno do servidor' });
    }
});

const viewsRouter = express.Router();

viewsRouter.get('/carts/:cid', checkAuthenticated, async (req, res) => {
    const { cid } = req.params;
    try {
        const cart = await Cart.findById(cid).populate('products.productId');
        if (!cart) {
            return res.status(404).json({ status: 'erro', message: 'Carrinho não encontrado' });
        }
        res.render('cart', { cart });
    } catch (error) {
        console.error('Erro ao buscar carrinho:', error);
        res.status(500).json({ status: 'erro', message: 'Erro interno do servidor' });
    }
});

viewsRouter.get('/products/:pid', checkAuthenticated, async (req, res) => {
    const { pid } = req.params;
    try {
        const product = await Product.findById(pid);
        if (!product) {
            return res.status(404).json({ status: 'erro', message: 'Produto não encontrado' });
        }
        res.render('productDetail', { product });
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ status: 'erro', message: 'Erro interno do servidor' });
    }
});

app.use('/', viewsRouter);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
