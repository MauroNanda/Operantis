const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all promotions
const getAllPromotions = async (req, res) => {
    try {
        const promotions = await prisma.promotion.findMany({
            include: {
                _count: {
                    select: {
                        sales: true
                    }
                }
            }
        });
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ error: 'Error getting promotions' });
    }
};

// Get promotion by ID
const getPromotionById = async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await prisma.promotion.findUnique({
            where: { id },
            include: {
                sales: true
            }
        });

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        res.json(promotion);
    } catch (error) {
        res.status(500).json({ error: 'Error getting promotion' });
    }
};

// Create a new promotion
const createPromotion = async (req, res) => {
    try {
        const {
            name,
            description,
            type,
            conditions,
            startDate,
            endDate
        } = req.body;

        // Validate promotion type
        if (!['BUY_X_GET_Y', 'BUNDLE', 'FLAT_RATE'].includes(type)) {
            return res.status(400).json({ error: 'Invalid promotion type' });
        }

        // Validate conditions based on type
        if (type === 'BUY_X_GET_Y') {
            if (!conditions.requiredQuantity || !conditions.freeQuantity) {
                return res.status(400).json({ error: 'BUY_X_GET_Y promotion requires requiredQuantity and freeQuantity' });
            }
        } else if (type === 'BUNDLE') {
            if (!conditions.products || !Array.isArray(conditions.products) || conditions.products.length < 2) {
                return res.status(400).json({ error: 'BUNDLE promotion requires at least 2 products' });
            }
            if (!conditions.discountPercentage && !conditions.fixedPrice) {
                return res.status(400).json({ error: 'BUNDLE promotion requires either discountPercentage or fixedPrice' });
            }
        } else if (type === 'FLAT_RATE') {
            if (!conditions.flatRate) {
                return res.status(400).json({ error: 'FLAT_RATE promotion requires flatRate' });
            }
        }

        const promotion = await prisma.promotion.create({
            data: {
                name,
                description,
                type,
                conditions,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            }
        });

        res.status(201).json(promotion);
    } catch (error) {
        res.status(500).json({ error: 'Error creating promotion' });
    }
};

// Update a promotion
const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            type,
            conditions,
            startDate,
            endDate,
            isActive
        } = req.body;

        // Check if promotion exists
        const existingPromotion = await prisma.promotion.findUnique({
            where: { id }
        });

        if (!existingPromotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        // Validate promotion type
        if (type && !['BUY_X_GET_Y', 'BUNDLE', 'FLAT_RATE'].includes(type)) {
            return res.status(400).json({ error: 'Invalid promotion type' });
        }

        // Validate conditions based on type
        if (type === 'BUY_X_GET_Y') {
            if (!conditions.requiredQuantity || !conditions.freeQuantity) {
                return res.status(400).json({ error: 'BUY_X_GET_Y promotion requires requiredQuantity and freeQuantity' });
            }
        } else if (type === 'BUNDLE') {
            if (!conditions.products || !Array.isArray(conditions.products) || conditions.products.length < 2) {
                return res.status(400).json({ error: 'BUNDLE promotion requires at least 2 products' });
            }
            if (!conditions.discountPercentage && !conditions.fixedPrice) {
                return res.status(400).json({ error: 'BUNDLE promotion requires either discountPercentage or fixedPrice' });
            }
        } else if (type === 'FLAT_RATE') {
            if (!conditions.flatRate) {
                return res.status(400).json({ error: 'FLAT_RATE promotion requires flatRate' });
            }
        }

        const promotion = await prisma.promotion.update({
            where: { id },
            data: {
                name,
                description,
                type,
                conditions,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                isActive
            }
        });

        res.json(promotion);
    } catch (error) {
        res.status(500).json({ error: 'Error updating promotion' });
    }
};

// Delete a promotion
const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if promotion exists and has no associated sales
        const promotion = await prisma.promotion.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        sales: true
                    }
                }
            }
        });

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        if (promotion._count.sales > 0) {
            return res.status(400).json({ error: 'Cannot delete promotion with associated sales' });
        }

        await prisma.promotion.delete({
            where: { id }
        });

        res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting promotion' });
    }
};

// Validate and apply promotion
const validatePromotion = async (promotionId, items) => {
    const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId }
    });

    if (!promotion) {
        return { valid: false, error: 'Invalid promotion' };
    }

    if (!promotion.isActive) {
        return { valid: false, error: 'Promotion is not active' };
    }

    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
        return { valid: false, error: 'Promotion is not valid for current date' };
    }

    let isValid = false;
    let discountAmount = 0;

    switch (promotion.type) {
        case 'BUY_X_GET_Y':
            const { requiredQuantity, freeQuantity, productId } = promotion.conditions;
            const item = items.find(i => i.productId === productId);
            if (item && item.quantity >= requiredQuantity) {
                isValid = true;
                discountAmount = (item.price * freeQuantity);
            }
            break;

        case 'BUNDLE':
            const { products, discountPercentage, fixedPrice } = promotion.conditions;
            const bundleItems = items.filter(i => products.includes(i.productId));
            if (bundleItems.length === products.length) {
                isValid = true;
                if (discountPercentage) {
                    discountAmount = bundleItems.reduce((total, item) => 
                        total + (item.price * item.quantity), 0) * (discountPercentage / 100);
                } else {
                    const originalPrice = bundleItems.reduce((total, item) => 
                        total + (item.price * item.quantity), 0);
                    discountAmount = originalPrice - fixedPrice;
                }
            }
            break;

        case 'FLAT_RATE':
            const { flatRate } = promotion.conditions;
            const totalAmount = items.reduce((total, item) => 
                total + (item.price * item.quantity), 0);
            if (totalAmount >= flatRate.minimumAmount) {
                isValid = true;
                discountAmount = flatRate.discountAmount;
            }
            break;
    }

    return {
        valid: isValid,
        promotion,
        discountAmount: isValid ? discountAmount : 0
    };
};

module.exports = {
    getAllPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion,
    validatePromotion
}; 