const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todas las ventas
const getAllSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(sales);
  } catch (error) {
    console.error('Error getting sales:', error);
    res.status(500).json({ error: 'Error getting sales' });
  }
};

// Ver detalles de una venta por ID
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      }
    });
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    console.error('Error getting sale:', error);
    res.status(500).json({ error: 'Error getting sale' });
  }
};

// Registrar una venta
const createSale = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Validar productos y stock
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== items.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Verificar stock suficiente
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ error: `Quantity must be greater than 0 for product: ${product.name}` });
      }
    }

    // Calcular total y preparar items
    let total = 0;
    const saleItemsData = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const unitPrice = product.price;
      total += unitPrice * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice
      };
    });

    // Crear la venta y descontar stock en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear venta
      const newSale = await tx.sale.create({
        data: {
          userId,
          total,
          items: {
            create: saleItemsData
          }
        },
        include: {
          items: true
        }
      });

      // Descontar stock
      for (const item of saleItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Error creating sale' });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale
}; 