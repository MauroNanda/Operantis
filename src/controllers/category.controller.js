const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error getting categories' });
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                products: true
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error getting category' });
    }
};

// Create a new category
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if category with same name exists
        const existingCategory = await prisma.category.findFirst({
            where: { name }
        });

        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                description
            }
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error creating category' });
    }
};

// Update a category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if new name is already taken by another category
        if (name !== existingCategory.name) {
            const nameExists = await prisma.category.findFirst({
                where: {
                    name,
                    id: { not: id }
                }
            });

            if (nameExists) {
                return res.status(400).json({ error: 'Category with this name already exists' });
            }
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                description
            }
        });

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error updating category' });
    }
};

// Delete a category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists and has no associated products
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        if (category._count.products > 0) {
            return res.status(400).json({ error: 'Cannot delete category with associated products' });
        }

        await prisma.category.delete({
            where: { id }
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting category' });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
}; 