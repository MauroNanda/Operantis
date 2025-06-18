function validateProduct(req, res, next) {
  const { name, description, price, stock, sku } = req.body;

  // Validar name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string.' });
  }

  // Validar description
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({ error: 'Description is required and must be a non-empty string.' });
  }

  // Validar price
  if (price === undefined || isNaN(price) || Number(price) <= 0) {
    return res.status(400).json({ error: 'Price is required and must be a number greater than 0.' });
  }

  // Validar stock
  if (stock === undefined || isNaN(stock) || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ error: 'Stock is required and must be an integer greater than or equal to 0.' });
  }

  // Validar sku
  if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
    return res.status(400).json({ error: 'SKU is required and must be a non-empty string.' });
  }

  next();
}

module.exports = { validateProduct }; 