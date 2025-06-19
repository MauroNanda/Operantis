const { PrismaClient } = require('@prisma/client');
const productController = require('../../src/controllers/product.controller');

// Mock Prisma
jest.mock('@prisma/client');

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  category: {
    findUnique: jest.fn()
  },
  supplier: {
    findUnique: jest.fn()
  }
};

// Mock the PrismaClient constructor
PrismaClient.mockImplementation(() => mockPrisma);

describe('Product Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: '1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should return all products with category and supplier info', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          stock: 50,
          category: { name: 'Electronics' },
          supplier: { name: 'Supplier 1' }
        }
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      await productController.getAllProducts(req, res);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        include: {
          category: true,
          supplier: true
        }
      });
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should handle database errors', async () => {
      mockPrisma.product.findMany.mockRejectedValue(new Error('Database error'));

      await productController.getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error getting products' });
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const productId = '1';
      const mockProduct = {
        id: productId,
        name: 'Product 1',
        price: 100,
        stock: 50,
        category: { name: 'Electronics' },
        supplier: { name: 'Supplier 1' }
      };

      req.params.id = productId;
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      await productController.getProductById(req, res);

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: {
          category: true,
          supplier: true
        }
      });
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 404 for non-existent product', async () => {
      req.params.id = '999';
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 150,
        stock: 100,
        sku: 'SKU-001',
        categoryId: '1',
        supplierId: '1'
      };

      req.body = productData;

      // Mock category and supplier existence
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.supplier.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.product.findUnique.mockResolvedValue(null); // SKU not exists
      mockPrisma.product.create.mockResolvedValue({
        id: '1',
        ...productData
      });

      await productController.createProduct(req, res);

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: productData
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: productData.name
        })
      );
    });

    it('should return error for duplicate SKU', async () => {
      const productData = {
        name: 'New Product',
        sku: 'EXISTING-SKU'
      };

      req.body = productData;
      mockPrisma.product.findUnique.mockResolvedValue({ id: '1' }); // SKU exists

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'SKU already exists' });
    });

    it('should return error for invalid category', async () => {
      const productData = {
        name: 'New Product',
        categoryId: '999'
      };

      req.body = productData;
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const productId = '1';
      const updateData = {
        name: 'Updated Product',
        price: 200
      };

      req.params.id = productId;
      req.body = updateData;

      const existingProduct = {
        id: productId,
        name: 'Old Product',
        sku: 'SKU-001'
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue({
        id: productId,
        ...updateData
      });

      await productController.updateProduct(req, res);

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: updateData
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: productId,
          name: updateData.name
        })
      );
    });

    it('should return 404 for non-existent product', async () => {
      req.params.id = '999';
      req.body = { name: 'Updated Product' };

      mockPrisma.product.findUnique.mockResolvedValue(null);

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const productId = '1';

      req.params.id = productId;

      mockPrisma.product.findUnique.mockResolvedValue({
        id: productId,
        name: 'Product to delete'
      });
      mockPrisma.product.delete.mockResolvedValue({ id: productId });

      await productController.deleteProduct(req, res);

      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: productId }
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product deleted successfully'
      });
    });

    it('should return 404 for non-existent product', async () => {
      req.params.id = '999';

      mockPrisma.product.findUnique.mockResolvedValue(null);

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });
  });
}); 