const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('./notification.controller');
const { validateDiscount } = require('./discount.controller');
const { validatePromotion } = require('./promotion.controller');

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
        const {
            customerId,
            items,
            discountCode,
            promotionId: inputPromotionId
        } = req.body;

        // Validate customer
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Calculate subtotal
        let subtotal = 0;
        const saleItems = [];

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

            subtotal += product.price * item.quantity;
            saleItems.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price
            });
        }

        // Apply discount if provided
        let discount = 0;
        let discountId = null;
        if (discountCode) {
            const discountResult = await validateDiscount(discountCode, subtotal);
            if (discountResult.valid) {
                if (discountResult.discount.type === 'PERCENTAGE') {
                    discount = subtotal * (discountResult.discount.value / 100);
                } else {
                    discount = discountResult.discount.value;
                }
                discountId = discountResult.discount.id;
            } else {
                return res.status(400).json({ error: discountResult.error });
            }
        }

        // Apply promotion if provided
        let promotionDiscount = 0;
        let appliedPromotionId = null;
        if (inputPromotionId) {
            const promotionResult = await validatePromotion(inputPromotionId, saleItems);
            if (promotionResult.valid) {
                promotionDiscount = promotionResult.discountAmount;
                appliedPromotionId = promotionResult.promotion.id;
            } else {
                return res.status(400).json({ error: promotionResult.error });
            }
        }

        // Calculate total
        const total = subtotal - discount - promotionDiscount;

        // Create sale
        const sale = await prisma.sale.create({
            data: {
                customerId,
                subtotal,
                discount,
                total,
                discountId,
                promotionId: appliedPromotionId,
                items: {
                    create: saleItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                customer: true
            }
        });

        // Update product stock
        for (const item of saleItems) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity
                    }
                }
            });

            // Check if stock is low after sale
            const updatedProduct = await prisma.product.findUnique({
                where: { id: item.productId }
            });

            if (updatedProduct.stock < 10) {
                await createNotification(req.user.id, 'STOCK_LOW', `Low stock alert: ${updatedProduct.name} has ${updatedProduct.stock} units remaining`);
            }
        }

        // Create notification for significant sales
        if (total > 1000) {
            await createNotification(req.user.id, 'SALE', `Significant sale: $${total} to ${customer.name}`);
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