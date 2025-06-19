const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../src/index');

const prisma = new PrismaClient();

describe('Product Routes', () => {
  let authToken;
  let adminToken;
  let testCategory;
  let testSupplier;

  beforeAll(async () => {
    // Clean up database
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Create test category and supplier
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category description'
      }
    });

    testSupplier = await prisma.supplier.create({
      data: {
        name: 'Test Supplier',
        email: 'supplier@test.com',
        phone: '123456789'
      }
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      }
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      }
    });

    // Generate tokens
    authToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret');
    adminToken = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET || 'secret');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up products before each test
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.product.deleteMany();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      // Create test products
      await prisma.product.createMany({
        data: [
          {
            name: 'Product 1',
            description: 'Description 1',
            price: 100,
            stock: 50,
            sku: 'SKU-001',
            categoryId: testCategory.id,
            supplierId: testSupplier.id
          },
          {
            name: 'Product 2',
            description: 'Description 2',
            price: 200,
            stock: 30,
            sku: 'SKU-002',
            categoryId: testCategory.id,
            supplierId: testSupplier.id
          }
        ]
      });

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name', 'Product 1');
      expect(response.body[1]).toHaveProperty('name', 'Product 2');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by ID', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          description: 'Test Description',
          price: 150,
          stock: 75,
          sku: 'SKU-TEST',
          categoryId: testCategory.id,
          supplierId: testSupplier.id
        }
      });

      const response = await request(app)
        .get(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', product.id);
      expect(response.body).toHaveProperty('name', 'Test Product');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('supplier');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('POST /api/products', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'New product description',
        price: 250,
        stock: 100,
        sku: 'SKU-NEW',
        categoryId: testCategory.id,
        supplierId: testSupplier.id
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', productData.name);
      expect(response.body).toHaveProperty('sku', productData.sku);
    });

    it('should return error for duplicate SKU', async () => {
      // Create first product
      await prisma.product.create({
        data: {
          name: 'First Product',
          sku: 'SKU-DUPLICATE',
          price: 100,
          stock: 50,
          categoryId: testCategory.id,
          supplierId: testSupplier.id
        }
      });

      // Try to create second product with same SKU
      const productData = {
        name: 'Second Product',
        sku: 'SKU-DUPLICATE',
        price: 200,
        stock: 30,
        categoryId: testCategory.id,
        supplierId: testSupplier.id
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'SKU already exists');
    });

    it('should require admin role', async () => {
      const productData = {
        name: 'New Product',
        sku: 'SKU-TEST',
        price: 100,
        stock: 50
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product successfully', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Original Product',
          description: 'Original description',
          price: 100,
          stock: 50,
          sku: 'SKU-ORIGINAL',
          categoryId: testCategory.id,
          supplierId: testSupplier.id
        }
      });

      const updateData = {
        name: 'Updated Product',
        price: 150,
        stock: 75
      };

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Product');
      expect(response.body).toHaveProperty('price', 150);
      expect(response.body).toHaveProperty('stock', 75);
    });

    it('should return 404 for non-existent product', async () => {
      const updateData = {
        name: 'Updated Product'
      };

      const response = await request(app)
        .put('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product successfully', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Product to Delete',
          sku: 'SKU-DELETE',
          price: 100,
          stock: 50,
          categoryId: testCategory.id,
          supplierId: testSupplier.id
        }
      });

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Product deleted successfully');

      // Verify product is deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });
      expect(deletedProduct).toBeNull();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });
}); 