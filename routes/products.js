const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productsController');

router.get('/', ProductController.getProducts);
router.get('/:pid', ProductController.getProduct);
router.post('/', ProductController.createProduct);
router.put('/:pid', ProductController.updateProduct);
router.delete('/:pid', ProductController.deleteProduct);

module.exports = router;
