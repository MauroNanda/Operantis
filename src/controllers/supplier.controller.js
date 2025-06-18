const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todos los proveedores
const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ error: 'Error getting suppliers' });
  }
};

// Obtener un proveedor por ID
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            price: true
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ error: 'Error getting supplier' });
  }
};

// Crear un nuevo proveedor
const createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validar email único
    const existingSupplier = await prisma.supplier.findUnique({
      where: { email }
    });

    if (existingSupplier) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        email,
        phone,
        address
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Error creating supplier' });
  }
};

// Actualizar un proveedor
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // Verificar si el proveedor existe
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (email && email !== existingSupplier.email) {
      const emailExists = await prisma.supplier.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address
      }
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Error updating supplier' });
  }
};

// Eliminar un proveedor
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el proveedor tiene productos asociados
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (supplier._count.products > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete supplier with associated products' 
      });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Error deleting supplier' });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
}; 