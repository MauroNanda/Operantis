const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');
const {
    getAllDiscounts,
    getDiscountById,
    createDiscount,
    updateDiscount,
    deleteDiscount
} = require('../controllers/discount.controller');

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     summary: Get all discounts
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of discounts
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getAllDiscounts);

/**
 * @swagger
 * /api/discounts/{id}:
 *   get:
 *     summary: Get discount by ID
 *     tags: [Discounts]
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
 *         description: Discount details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 */
router.get('/:id', authMiddleware, getDiscountById);

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     summary: Create a new discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - type
 *               - value
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *               value:
 *                 type: number
 *               minPurchase:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               maxUses:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Discount created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, authorizeRoles(['ADMIN', 'MANAGER']), createDiscount);

/**
 * @swagger
 * /api/discounts/{id}:
 *   put:
 *     summary: Update a discount
 *     tags: [Discounts]
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
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *               value:
 *                 type: number
 *               minPurchase:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               maxUses:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 */
router.put('/:id', authMiddleware, authorizeRoles(['ADMIN', 'MANAGER']), updateDiscount);

/**
 * @swagger
 * /api/discounts/{id}:
 *   delete:
 *     summary: Delete a discount
 *     tags: [Discounts]
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
 *         description: Discount deleted successfully
 *       400:
 *         description: Cannot delete discount with associated sales
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 */
router.delete('/:id', authMiddleware, authorizeRoles(['ADMIN']), deleteDiscount);

module.exports = router; 