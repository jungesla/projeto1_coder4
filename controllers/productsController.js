const ProductDAO = require('./dao/productDAO');

exports.getProducts = async (req, res) => {
  try {
    const products = await ProductDAO.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await ProductDAO.getProductById(req.params.pid);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const newProduct = await ProductDAO.createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await ProductDAO.updateProduct(req.params.pid, req.body);
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await ProductDAO.deleteProduct(req.params.pid);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
};
