const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('./notification.controller');

// Get all sales
const getAllSales = async (req, res) => {
    try {
        const sales = await prisma.sale.findMany({
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Error getting sales' });
    }
};

// Get sale by ID
const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        res.json(sale);
    } catch (error) {
        res.status(500).json({ error: 'Error getting sale' });
    }
};

// Create a new sale
const createSale = async (req, res) => {
    try {
        const { customerId, items } = req.body;
        const userId = req.user.id;

        // Validate customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Validate products and calculate total
        let total = 0;
        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId }
            });

            if (!product) {
                return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
            }

            total += product.price * item.quantity;
        }

        // Create sale with items
        const sale = await prisma.sale.create({
            data: {
                customerId,
                userId,
                total,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        // Update product stock
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity
                    }
                }
            });

            // Check if stock is low after sale
            const product = await prisma.product.findUnique({
                where: { id: item.productId }
            });

            if (product.stock < 10) {
                await createNotification(
                    userId,
                    'STOCK_LOW',
                    `Low stock alert: ${product.name} has only ${product.stock} units left`
                );
            }
        }

        // Create notification for significant sales
        if (total > 1000) {
            await createNotification(
                userId,
                'SALE',
                `Significant sale: $${total}`
            );
        }

        res.status(201).json(sale);
    } catch (error) {
        res.status(500).json({ error: 'Error creating sale' });
    }
};

// Delete a sale
const deleteSale = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if sale exists
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Restore product stock
        for (const item of sale.items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.quantity
                    }
                }
            });
        }

        // Delete sale and its items
        await prisma.sale.delete({
            where: { id }
        });

        res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting sale' });
    }
};

module.exports = {
    getAllSales,
    getSaleById,
    createSale,
    deleteSale
}; 