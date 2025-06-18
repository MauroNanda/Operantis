const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Reporte: Ventas agrupadas por fecha
const salesByDate = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from) where.date = { gte: new Date(from) };
    if (to) {
      where.date = where.date || {};
      where.date.lte = new Date(to);
    }
    const sales = await prisma.sale.groupBy({
      by: ['date'],
      _sum: { total: true },
      where,
      orderBy: { date: 'asc' }
    });
    // Agrupar por día (YYYY-MM-DD)
    const result = {};
    sales.forEach(sale => {
      const day = sale.date.toISOString().slice(0, 10);
      if (!result[day]) result[day] = 0;
      result[day] += Number(sale._sum.total || 0);
    });
    res.json(result);
  } catch (error) {
    console.error('Error in salesByDate:', error);
    res.status(500).json({ error: 'Error generating sales by date report' });
  }
};

// Reporte: Productos más vendidos
const topProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const products = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit
    });
    // Obtener info de productos
    const productIds = products.map(p => p.productId);
    const productInfo = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    });
    const result = products.map(p => {
      const info = productInfo.find(pi => pi.id === p.productId);
      return {
        productId: p.productId,
        name: info ? info.name : '',
        sku: info ? info.sku : '',
        quantitySold: p._sum.quantity
      };
    });
    res.json(result);
  } catch (error) {
    console.error('Error in topProducts:', error);
    res.status(500).json({ error: 'Error generating top products report' });
  }
};

// Reporte: Productos con bajo stock
const stockLow = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const products = await prisma.product.findMany({
      where: { stock: { lte: threshold } },
      select: { id: true, name: true, sku: true, stock: true }
    });
    res.json(products);
  } catch (error) {
    console.error('Error in stockLow:', error);
    res.status(500).json({ error: 'Error generating stock low report' });
  }
};

// Reporte: Ventas por usuario
const salesByUser = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from) where.date = { gte: new Date(from) };
    if (to) {
      where.date = where.date || {};
      where.date.lte = new Date(to);
    }

    const sales = await prisma.sale.groupBy({
      by: ['userId'],
      _sum: { total: true },
      _count: { id: true },
      where,
      orderBy: { _sum: { total: 'desc' } }
    });

    // Obtener información de usuarios
    const userIds = sales.map(s => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    const result = sales.map(sale => {
      const user = users.find(u => u.id === sale.userId);
      return {
        userId: sale.userId,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : null,
        totalSales: sale._sum.total,
        numberOfSales: sale._count.id
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error in salesByUser:', error);
    res.status(500).json({ error: 'Error generating sales by user report' });
  }
};

// Reporte: Productos nunca vendidos
const neverSoldProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        NOT: {
          items: {
            some: {}
          }
        }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Error in neverSoldProducts:', error);
    res.status(500).json({ error: 'Error generating never sold products report' });
  }
};

// Reporte: Resumen de ingresos por período
const revenueSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from) where.date = { gte: new Date(from) };
    if (to) {
      where.date = where.date || {};
      where.date.lte = new Date(to);
    }

    const sales = await prisma.sale.findMany({
      where,
      select: {
        total: true,
        date: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true
          }
        }
      }
    });

    const summary = {
      totalRevenue: 0,
      totalUnits: 0,
      averageTicket: 0,
      salesByDay: {},
      totalSales: sales.length
    };

    sales.forEach(sale => {
      summary.totalRevenue += Number(sale.total);
      const day = sale.date.toISOString().slice(0, 10);
      if (!summary.salesByDay[day]) {
        summary.salesByDay[day] = {
          revenue: 0,
          units: 0
        };
      }
      summary.salesByDay[day].revenue += Number(sale.total);
      
      sale.items.forEach(item => {
        summary.totalUnits += item.quantity;
        summary.salesByDay[day].units += item.quantity;
      });
    });

    summary.averageTicket = summary.totalSales > 0 
      ? summary.totalRevenue / summary.totalSales 
      : 0;

    res.json(summary);
  } catch (error) {
    console.error('Error in revenueSummary:', error);
    res.status(500).json({ error: 'Error generating revenue summary report' });
  }
};

// Reporte: Productos con mejor margen de ganancia
const bestMarginProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true
          }
        }
      }
    });

    const productsWithMargin = products.map(product => {
      const totalSold = product.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = product.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const margin = totalRevenue - (totalSold * product.price);
      
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        totalSold,
        totalRevenue,
        margin,
        marginPerUnit: totalSold > 0 ? margin / totalSold : 0
      };
    });

    const sortedProducts = productsWithMargin
      .sort((a, b) => b.margin - a.margin)
      .slice(0, limit);

    res.json(sortedProducts);
  } catch (error) {
    console.error('Error in bestMarginProducts:', error);
    res.status(500).json({ error: 'Error generating best margin products report' });
  }
};

module.exports = {
  salesByDate,
  topProducts,
  stockLow,
  salesByUser,
  neverSoldProducts,
  revenueSummary,
  bestMarginProducts
}; 