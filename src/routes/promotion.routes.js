const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');
const {
    getAllPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion
} = require('../controllers/promotion.controller');

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     summary: Get all promotions
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of promotions
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getAllPromotions);

/**
 * @swagger
 * /api/promotions/{id}:
 *   get:
 *     summary: Get promotion by ID
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promotion details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Promotion not found
 */
router.get('/:id', authMiddleware, getPromotionById);

/**
 * @swagger
 * /api/promotions:
 *   post:
 *     summary: Create a new promotion
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - conditions
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [BUY_X_GET_Y, BUNDLE, FLAT_RATE]
 *               conditions:
 *                 type: object
 *                 properties:
 *                   requiredQuantity:
 *                     type: integer
 *                   freeQuantity:
 *                     type: integer
 *                   productId:
 *                     type: string
 *                   products:
 *                     type: array
 *                     items:
 *                       type: string
 *                   discountPercentage:
 *                     type: number
 *                   fixedPrice:
 *                     type: number
 *                   flatRate:
 *                     type: object
 *                     properties:
 *                       minimumAmount:
 *                         type: number
 *                       discountAmount:
 *                         type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Promotion created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, authorizeRoles(['ADMIN', 'MANAGER']), createPromotion);

/**
 * @swagger
 * /api/promotions/{id}:
 *   put:
 *     summary: Update a promotion
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [BUY_X_GET_Y, BUNDLE, FLAT_RATE]
 *               conditions:
 *                 type: object
 *                 properties:
 *                   requiredQuantity:
 *                     type: integer
 *                   freeQuantity:
 *                     type: integer
 *                   productId:
 *                     type: string
 *                   products:
 *                     type: array
 *                     items:
 *                       type: string
 *                   discountPercentage:
 *                     type: number
 *                   fixedPrice:
 *                     type: number
 *                   flatRate:
 *                     type: object
 *                     properties:
 *                       minimumAmount:
 *                         type: number
 *                       discountAmount:
 *                         type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Promotion updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Promotion not found
 */
router.put('/:id', authMiddleware, authorizeRoles(['ADMIN', 'MANAGER']), updatePromotion);

/**
 * @swagger
 * /api/promotions/{id}:
 *   delete:
 *     summary: Delete a promotion
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promotion deleted successfully
 *       400:
 *         description: Cannot delete promotion with associated sales
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Promotion not found
 */
router.delete('/:id', authMiddleware, authorizeRoles(['ADMIN']), deletePromotion);

module.exports = router; 