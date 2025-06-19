// Test setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/operantis_test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Helper to create test data
  createTestUser: async (prisma, userData = {}) => {
    return await prisma.user.create({
      data: {
        email: userData.email || 'test@example.com',
        password: userData.password || 'password123',
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'User',
        role: userData.role || 'USER',
        ...userData
      }
    });
  },

  // Helper to create test product
  createTestProduct: async (prisma, productData = {}) => {
    return await prisma.product.create({
      data: {
        name: productData.name || 'Test Product',
        description: productData.description || 'Test Description',
        price: productData.price || 100.0,
        stock: productData.stock || 50,
        sku: productData.sku || 'TEST-SKU-001',
        ...productData
      }
    });
  },

  // Helper to create test customer
  createTestCustomer: async (prisma, customerData = {}) => {
    return await prisma.customer.create({
      data: {
        name: customerData.name || 'Test Customer',
        email: customerData.email || 'customer@example.com',
        phone: customerData.phone || '123456789',
        address: customerData.address || 'Test Address',
        ...customerData
      }
    });
  }
}; 