const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../../src/controllers/auth.controller');

// Mock Prisma
jest.mock('@prisma/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn()
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn()
  }
};

PrismaClient.mockImplementation(() => mockPrisma);

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      req.body = userData;

      mockPrisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'USER'
      });
      jwt.sign.mockReturnValue('mockToken');

      await authController.register(req, res);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: 'hashedPassword',
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'USER'
        }
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully',
          token: 'mockToken'
        })
      );
    });

    it('should return error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      req.body = userData;
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User with this email already exists' });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: '1',
        email: loginData.email,
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      };

      req.body = loginData;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken');

      await authController.login(req, res);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'mockToken'
        })
      );
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      req.body = loginData;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      req.user = { id: '1' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authController.getProfile(req, res);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user not found', async () => {
      req.user = { id: '1' };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com'
      };

      const existingUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword'
      };

      const updatedUser = {
        id: '1',
        ...updateData,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      req.user = { id: '1' };
      req.body = updateData;

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await authController.updateProfile(req, res);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          email: updateData.email,
          password: existingUser.password
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'validRefreshToken';
      const mockUser = {
        id: '1',
        email: 'test@example.com'
      };

      req.body = { refreshToken };
      jwt.verify.mockReturnValue({ userId: '1' });
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: '1',
        token: refreshToken,
        userId: '1'
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('newAccessToken');

      await authController.refreshToken(req, res);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: 'newAccessToken'
      });
    });

    it('should return error for invalid refresh token', async () => {
      const refreshToken = 'invalidRefreshToken';

      req.body = { refreshToken };
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid refresh token'
      });
    });
  });
}); 