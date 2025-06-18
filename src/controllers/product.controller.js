const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('./notification.controller');

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
                supplier: true
            }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error getting products' });
    }
};

// Get product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                supplier: true
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error getting product' });
    }
};

// Create a new product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, supplierId } = req.body;
        const userId = req.user.id;

        // Validate category exists
        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId }
            });
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
        }

        // Validate supplier exists
        if (supplierId) {
            const supplier = await prisma.supplier.findUnique({
                where: { id: supplierId }
            });
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price,
                stock,
                categoryId,
                supplierId
            }
        });

        // Check if stock is low
        if (stock < 10) {
            await createNotification(
                userId,
                'STOCK_LOW',
                `Low stock alert: ${name} has only ${stock} units left`
            );
        }

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error creating product' });
    }
};

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, categoryId, supplierId } = req.body;
        const userId = req.user.id;

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Validate category exists
        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId }
            });
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
        }

        // Validate supplier exists
        if (supplierId) {
            const supplier = await prisma.supplier.findUnique({
                where: { id: supplierId }
            });
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                price,
                stock,
                categoryId,
                supplierId
            }
        });

        // Check if stock is low
        if (stock < 10) {
            await createNotification(
                userId,
                'STOCK_LOW',
                `Low stock alert: ${name} has only ${stock} units left`
            );
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error updating product' });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists and has no associated sales
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        saleItems: true
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product._count.saleItems > 0) {
            return res.status(400).json({ error: 'Cannot delete product with associated sales' });
        }

        await prisma.product.delete({
            where: { id }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting product' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
}; 