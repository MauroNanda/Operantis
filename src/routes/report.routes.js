const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reports and analytics
 */

/**
 * @swagger
 * /api/reports/sales-by-date:
 *   get:
 *     summary: Get total sales grouped by date
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales by date
 */
router.get('/sales-by-date', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), reportController.salesByDate);

/**
 * @swagger
 * /api/reports/top-products:
 *   get:
 *     summary: Get top selling products
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of top products to return
 *     responses:
 *       200:
 *         description: Top selling products
 */
router.get('/top-products', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), reportController.topProducts);

/**
 * @swagger
 * /api/reports/stock-low:
 *   get:
 *     summary: Get products with low stock
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 5
 *         required: false
 *         description: Stock threshold
 *     responses:
 *       200:
 *         description: Products with low stock
 */
router.get('/stock-low', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), reportController.stockLow);

/**
 * @swagger
 * /api/reports/sales-by-user:
 *   get:
 *     summary: Get sales grouped by user
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales by user
 */
router.get('/sales-by-user', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), reportController.salesByUser);

/**
 * @swagger
 * /api/reports/never-sold:
 *   get:
 *     summary: Get products that have never been sold
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products never sold
 */
router.get('/never-sold', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), reportController.neverSoldProducts);

/**
 * @swagger
 * /api/reports/revenue-summary:
 *   get:
 *     summary: Get revenue summary for a period
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue summary
 */
router.get('/revenue-summary', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), reportController.revenueSummary);

/**
 * @swagger
 * /api/reports/best-margin:
 *   get:
 *     summary: Get products with best profit margin
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         required: false
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: Products with best margin
 */
router.get('/best-margin', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), reportController.bestMarginProducts);

module.exports = router; 