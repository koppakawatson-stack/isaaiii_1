import Product from '../models/Product.js';
import ActivityLog from '../models/ActivityLog.js';

// Helper to log activities
const logActivity = async (userId, userName, action, details) => {
  try {
    await ActivityLog.create({ userId, userName, action, details });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin/Manager only)
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, availability, description } = req.body;

    if (req.user.role === 'BDA') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const product = await Product.create({ name, category, price, availability, description });

    await logActivity(req.user.id, req.user.name, 'CREATE_PRODUCT', `Created product ${name} ($${price})`);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin/Manager only)
export const updateProduct = async (req, res) => {
  try {
    if (req.user.role === 'BDA') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await logActivity(req.user.id, req.user.name, 'UPDATE_PRODUCT', `Updated product details for ${product.name}`);

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin/Manager only)
export const deleteProduct = async (req, res) => {
  try {
    if (req.user.role === 'BDA') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    await logActivity(req.user.id, req.user.name, 'DELETE_PRODUCT', `Deleted product ${product.name}`);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
