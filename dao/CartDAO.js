const Cart = require('../models/Cart');

class CartDAO {
  async createCart(cartData) {
    const cart = new Cart(cartData);
    return cart.save();
  }

  async getCartById(cartId) {
    return Cart.findById(cartId).populate('products.productId');
  }
}

module.exports = new CartDAO();
