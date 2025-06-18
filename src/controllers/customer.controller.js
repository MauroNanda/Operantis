const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all customers
const getAllCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                _count: {
                    select: {
                        sales: true
                    }
                }
            }
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Error getting customers' });
    }
};

// Get customer by ID
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
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Error getting customer' });
    }
};

// Create a new customer
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        // Check if customer with same email exists
        const existingCustomer = await prisma.customer.findFirst({
            where: { email }
        });

        if (existingCustomer) {
            return res.status(400).json({ error: 'Customer with this email already exists' });
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
        res.status(500).json({ error: 'Error creating customer' });
    }
};

// Update a customer
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        // Check if customer exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { id }
        });

        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Check if new email is already taken by another customer
        if (email !== existingCustomer.email) {
            const emailExists = await prisma.customer.findFirst({
                where: {
                    email,
                    id: { not: id }
                }
            });

            if (emailExists) {
                return res.status(400).json({ error: 'Customer with this email already exists' });
            }
        }

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address
            }
        });

        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Error updating customer' });
    }
};

// Delete a customer
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if customer exists and has no associated sales
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        sales: true
                    }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        if (customer._count.sales > 0) {
            return res.status(400).json({ error: 'Cannot delete customer with associated sales' });
        }

        await prisma.customer.delete({
            where: { id }
        });

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting customer' });
    }
};

// Get customer purchase history
const getCustomerPurchaseHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { id }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Build date filter
        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.lte = new Date(endDate);
        }

        // Get sales with date filter
        const sales = await prisma.sale.findMany({
            where: {
                customerId: id,
                ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
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
        });

        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Error getting customer purchase history' });
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