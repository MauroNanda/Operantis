const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../../src/middleware/auth.middleware');

// Mock jwt and prisma
jest.mock('jsonwebtoken');
jest.mock('@prisma/client');

const mockPrisma = {
  user: {
    findUnique: jest.fn()
  }
};

require('@prisma/client').PrismaClient.mockImplementation(() => mockPrisma);

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next() with valid token', async () => {
      const token = 'valid.token.here';
      const decodedToken = { id: '1', role: 'USER' };
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'USER',
        isActive: true
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(req.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when no authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header format is invalid', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      const token = 'invalid.token';
      req.headers.authorization = `Bearer ${token}`;

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      const token = 'valid.token.here';
      const decodedToken = { id: '1', role: 'USER' };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is inactive', async () => {
      const token = 'valid.token.here';
      const decodedToken = { id: '1', role: 'USER' };
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'USER',
        isActive: false
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User account is inactive' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should call next() when user has required role', () => {
      const requiredRoles = ['ADMIN', 'MANAGER'];
      req.user = { id: '1', role: 'ADMIN' };

      const middleware = authorize(...requiredRoles);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', () => {
      const requiredRoles = ['ADMIN'];
      req.user = { id: '1', role: 'USER' };

      const middleware = authorize(...requiredRoles);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user has no role', () => {
      const requiredRoles = ['ADMIN'];
      req.user = { id: '1' };

      const middleware = authorize(...requiredRoles);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with single role', () => {
      const requiredRole = 'ADMIN';
      req.user = { id: '1', role: 'ADMIN' };

      const middleware = authorize(requiredRole);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
}); 