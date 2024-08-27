const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');

router.post('/', CartController.createCart);
router.get('/:cid', CartController.getCart);

module.exports = router;
