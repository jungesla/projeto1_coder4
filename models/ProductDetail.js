const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductDetailSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  imageUrl: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('ProductDetail', ProductDetailSchema);
