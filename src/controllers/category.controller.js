const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las categorías
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
};

// Obtener una categoría por ID
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
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la categoría' });
    }
};

// Crear una nueva categoría
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Verificar si ya existe una categoría con el mismo nombre
        const existingCategory = await prisma.category.findUnique({
            where: { name }
        });

        if (existingCategory) {
            return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                description
            }
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la categoría' });
    }
};

// Actualizar una categoría
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Verificar si la categoría existe
        const existingCategory = await prisma.category.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
        if (name && name !== existingCategory.name) {
            const duplicateCategory = await prisma.category.findUnique({
                where: { name }
            });

            if (duplicateCategory) {
                return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
            }
        }

        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                name,
                description
            }
        });

        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
};

// Eliminar una categoría
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si la categoría tiene productos asociados
        const categoryWithProducts = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!categoryWithProducts) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        if (categoryWithProducts._count.products > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar la categoría porque tiene productos asociados' 
            });
        }

        await prisma.category.delete({
            where: { id }
        });

        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
}; 