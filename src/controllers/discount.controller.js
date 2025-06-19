const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all discounts
const getAllDiscounts = async (req, res) => {
    try {
        const discounts = await prisma.discount.findMany({
            include: {
                _count: {
                    select: {
                        sales: true
                    }
                }
            }
        });
        res.json(discounts);
    } catch (error) {
        res.status(500).json({ error: 'Error getting discounts' });
    }
};

// Get discount by ID
const getDiscountById = async (req, res) => {
    try {
        const { id } = req.params;
        const discount = await prisma.discount.findUnique({
            where: { id },
            include: {
                sales: true
            }
        });

        if (!discount) {
            return res.status(404).json({ error: 'Discount not found' });
        }

        res.json(discount);
    } catch (error) {
        res.status(500).json({ error: 'Error getting discount' });
    }
};

// Create a new discount
const createDiscount = async (req, res) => {
    try {
        const {
            code,
            type,
            value,
            minPurchase,
            startDate,
            endDate,
            maxUses
        } = req.body;

        // Validate discount type
        if (!['PERCENTAGE', 'FIXED_AMOUNT'].includes(type)) {
            return res.status(400).json({ error: 'Invalid discount type' });
        }

        // Validate value based on type
        if (type === 'PERCENTAGE' && (value < 0 || value > 100)) {
            return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
        }

        if (type === 'FIXED_AMOUNT' && value <= 0) {
            return res.status(400).json({ error: 'Fixed amount must be greater than 0' });
        }

        // Check if code already exists
        const existingDiscount = await prisma.discount.findUnique({
            where: { code }
        });

        if (existingDiscount) {
            return res.status(400).json({ error: 'Discount code already exists' });
        }

        const discount = await prisma.discount.create({
            data: {
                code,
                type,
                value,
                minPurchase,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                maxUses
            }
        });

        res.status(201).json(discount);
    } catch (error) {
        res.status(500).json({ error: 'Error creating discount' });
    }
};

// Update a discount
const updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            code,
            type,
            value,
            minPurchase,
            startDate,
            endDate,
            maxUses,
            isActive
        } = req.body;

        // Check if discount exists
        const existingDiscount = await prisma.discount.findUnique({
            where: { id }
        });

        if (!existingDiscount) {
            return res.status(404).json({ error: 'Discount not found' });
        }

        // If changing code, check if new code exists
        if (code && code !== existingDiscount.code) {
            const codeExists = await prisma.discount.findFirst({
                where: {
                    code,
                    id: { not: id }
                }
            });

            if (codeExists) {
                return res.status(400).json({ error: 'Discount code already exists' });
            }
        }

        // Validate discount type
        if (type && !['PERCENTAGE', 'FIXED_AMOUNT'].includes(type)) {
            return res.status(400).json({ error: 'Invalid discount type' });
        }

        // Validate value based on type
        if (type === 'PERCENTAGE' && (value < 0 || value > 100)) {
            return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
        }

        if (type === 'FIXED_AMOUNT' && value <= 0) {
            return res.status(400).json({ error: 'Fixed amount must be greater than 0' });
        }

        const discount = await prisma.discount.update({
            where: { id },
            data: {
                code,
                type,
                value,
                minPurchase,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                maxUses,
                isActive
            }
        });

        res.json(discount);
    } catch (error) {
        res.status(500).json({ error: 'Error updating discount' });
    }
};

// Delete a discount
const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if discount exists and has no associated sales
        const discount = await prisma.discount.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        sales: true
                    }
                }
            }
        });

        if (!discount) {
            return res.status(404).json({ error: 'Discount not found' });
        }

        if (discount._count.sales > 0) {
            return res.status(400).json({ error: 'Cannot delete discount with associated sales' });
        }

        await prisma.discount.delete({
            where: { id }
        });

        res.json({ message: 'Discount deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting discount' });
    }
};

// Validate and apply discount
const validateDiscount = async (code, amount) => {
    const discount = await prisma.discount.findUnique({
        where: { code }
    });

    if (!discount) {
        return { valid: false, error: 'Invalid discount code' };
    }

    if (!discount.isActive) {
        return { valid: false, error: 'Discount is not active' };
    }

    const now = new Date();
    if (now < discount.startDate || now > discount.endDate) {
        return { valid: false, error: 'Discount is not valid for current date' };
    }

    if (discount.minPurchase && amount < discount.minPurchase) {
        return { valid: false, error: `Minimum purchase amount of $${discount.minPurchase} required` };
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        return { valid: false, error: 'Discount has reached maximum uses' };
    }

    return { valid: true, discount };
};

module.exports = {
    getAllDiscounts,
    getDiscountById,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    validateDiscount
}; 