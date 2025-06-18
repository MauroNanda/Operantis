const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all suppliers
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

// Get supplier by ID
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

// Create a new supplier
const createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Check if supplier with same email exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { email }
    });

    if (existingSupplier) {
      return res.status(400).json({ error: 'Supplier with this email already exists' });
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

// Update a supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if new email is already taken by another supplier
    if (email !== existingSupplier.email) {
      const emailExists = await prisma.supplier.findFirst({
        where: {
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Supplier with this email already exists' });
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

// Delete a supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier exists and has no associated products
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
      return res.status(400).json({ error: 'Cannot delete supplier with associated products' });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.json({ message: 'Supplier deleted successfully' });
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