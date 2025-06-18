const validateSale = (req, res, next) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }

  if (items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  for (const item of items) {
    if (!item.productId) {
      return res.status(400).json({ error: 'Product ID is required for each item' });
    }
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number for each item' });
    }
  }

  next();
};

module.exports = {
  validateSale
}; 