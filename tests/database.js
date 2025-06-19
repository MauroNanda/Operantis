const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/operantis_test'
    }
  }
});

// Database utilities for testing
const dbUtils = {
  // Clean all tables
  cleanDatabase: async () => {
    const tables = [
      'SaleItem',
      'Sale',
      'Product',
      'Category',
      'Supplier',
      'Customer',
      'Notification',
      'Discount',
      'Promotion',
      'RefreshToken',
      'User'
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRaw`TRUNCATE TABLE "${table}" CASCADE`;
      } catch (error) {
        console.log(`Error cleaning table ${table}:`, error.message);
      }
    }
  },

  // Create test data
  createTestData: async () => {
    // Create roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN' }
    });

    const managerRole = await prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: { name: 'MANAGER' }
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER' }
    });

    // Create test users
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: 'hashedPassword',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        roleId: adminRole.id
      }
    });

    const managerUser = await prisma.user.create({
      data: {
        email: 'manager@test.com',
        password: 'hashedPassword',
        firstName: 'Manager',
        lastName: 'User',
        role: 'MANAGER',
        roleId: managerRole.id
      }
    });

    const regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: 'hashedPassword',
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        roleId: userRole.id
      }
    });

    // Create test categories
    const electronicsCategory = await prisma.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and accessories'
      }
    });

    const clothingCategory = await prisma.category.create({
      data: {
        name: 'Clothing',
        description: 'Apparel and accessories'
      }
    });

    // Create test suppliers
    const supplier1 = await prisma.supplier.create({
      data: {
        name: 'Tech Supplier Inc.',
        email: 'tech@supplier.com',
        phone: '123456789',
        address: '123 Tech Street'
      }
    });

    const supplier2 = await prisma.supplier.create({
      data: {
        name: 'Fashion Supplier Ltd.',
        email: 'fashion@supplier.com',
        phone: '987654321',
        address: '456 Fashion Avenue'
      }
    });

    // Create test customers
    const customer1 = await prisma.customer.create({
      data: {
        name: 'John Doe',
        email: 'john@customer.com',
        phone: '111222333',
        address: '789 Customer Road'
      }
    });

    const customer2 = await prisma.customer.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@customer.com',
        phone: '444555666',
        address: '321 Customer Lane'
      }
    });

    // Create test products
    const product1 = await prisma.product.create({
      data: {
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 999.99,
        stock: 50,
        sku: 'LAPTOP-001',
        categoryId: electronicsCategory.id,
        supplierId: supplier1.id
      }
    });

    const product2 = await prisma.product.create({
      data: {
        name: 'T-Shirt',
        description: 'Cotton t-shirt',
        price: 25.99,
        stock: 100,
        sku: 'TSHIRT-001',
        categoryId: clothingCategory.id,
        supplierId: supplier2.id
      }
    });

    return {
      users: { adminUser, managerUser, regularUser },
      categories: { electronicsCategory, clothingCategory },
      suppliers: { supplier1, supplier2 },
      customers: { customer1, customer2 },
      products: { product1, product2 },
      roles: { adminRole, managerRole, userRole }
    };
  },

  // Disconnect from database
  disconnect: async () => {
    await prisma.$disconnect();
  }
};

module.exports = { prisma, dbUtils }; 