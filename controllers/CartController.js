const CartDAO = require('../dao/CartDAO');

class CartController {
  async createCart(req, res) {
    const newCart = await CartDAO.createCart(req.body);
    res.json(newCart);
  }

  async getCart(req, res) {
    const cart = await CartDAO.getCartById(req.params.cid);
    res.json(cart);
  }
}

module.exports = new CartController();
