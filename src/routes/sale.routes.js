const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validateSale } = require('../middleware/saleValidator');

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales management
 */

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get('/', authenticateToken, saleController.getAllSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get a sale by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale found
 *       404:
 *         description: Sale not found
 */
router.get('/:id', authenticateToken, saleController.getSaleById);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Register a new sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Sale registered
 *       400:
 *         description: Invalid input or insufficient stock
 */
router.post('/', authenticateToken, validateSale, saleController.createSale);

module.exports = router; 