const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los clientes
const getAllCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                _count: {
                    select: { sales: true }
                }
            }
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los clientes' });
    }
};

// Obtener un cliente por ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                sales: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el cliente' });
    }
};

// Crear un nuevo cliente
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        // Verificar si ya existe un cliente con el mismo email
        const existingCustomer = await prisma.customer.findUnique({
            where: { email }
        });

        if (existingCustomer) {
            return res.status(400).json({ error: 'Ya existe un cliente con ese email' });
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                address
            }
        });

        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el cliente' });
    }
};

// Actualizar un cliente
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        // Verificar si el cliente existe
        const existingCustomer = await prisma.customer.findUnique({
            where: { id }
        });

        if (!existingCustomer) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        // Si se está cambiando el email, verificar que no exista otro con el mismo email
        if (email && email !== existingCustomer.email) {
            const duplicateCustomer = await prisma.customer.findUnique({
                where: { email }
            });

            if (duplicateCustomer) {
                return res.status(400).json({ error: 'Ya existe un cliente con ese email' });
            }
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address
            }
        });

        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el cliente' });
    }
};

// Eliminar un cliente
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el cliente tiene ventas asociadas
        const customerWithSales = await prisma.customer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { sales: true }
                }
            }
        });

        if (!customerWithSales) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        if (customerWithSales._count.sales > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el cliente porque tiene ventas asociadas' 
            });
        }

        await prisma.customer.delete({
            where: { id }
        });

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el cliente' });
    }
};

// Obtener el historial de compras de un cliente
const getCustomerPurchaseHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                sales: {
                    where: {
                        date: {
                            gte: startDate ? new Date(startDate) : undefined,
                            lte: endDate ? new Date(endDate) : undefined
                        }
                    },
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(customer.sales);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el historial de compras' });
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerPurchaseHistory
}; 