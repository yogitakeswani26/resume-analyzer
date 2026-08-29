import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { passwordResetLimiter } from '../../middleware/security.middleware.js';

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot view another user's profile
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               location:
 *                 type: string
 *                 example: San Francisco, CA
 *               bio:
 *                 type: string
 *                 example: Software developer
 *               expertise:
 *                 type: string
 *                 example: Full-stack development
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot update another user's profile
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user account with all related data
 *     description: |
 *       Permanently deletes the user account and all associated data:
 *       - User profile
 *       - All resumes
 *       - All analysis records
 *
 *       This action is irreversible. Password confirmation is required.
 *       All deletions are performed in a single transaction to ensure consistency.
 *       Deletion is logged for audit trail.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 description: User password for confirmation
 *                 example: password123
 *     responses:
 *       204:
 *         description: Account deleted successfully (No Content)
 *       400:
 *         description: Invalid input (missing password)
 *       401:
 *         description: Invalid password
 *       403:
 *         description: Forbidden - cannot delete another user's account
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error during deletion
 */

/**
 * @swagger
 * /users/{id}/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input or weak password
 *       401:
 *         description: Current password is incorrect
 *       403:
 *         description: Forbidden - cannot change another user's password
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     resumeCount:
 *                       type: number
 *                       example: 5
 *                     analysisCount:
 *                       type: number
 *                       example: 12
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot view another user's statistics
 *       404:
 *         description: User not found
 */

const router = Router();
const controller = new UserController();

// All routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/:id', (req, res, next) => controller.getProfile(req, res, next));

// Update user profile
router.patch('/:id', (req, res, next) => controller.updateProfile(req, res, next));

// Change password - Rate limited (3 attempts per 15 minutes) to prevent brute force
router.post('/:id/change-password', passwordResetLimiter, (req, res, next) => controller.changePassword(req, res, next));

// Get user statistics
router.get('/:id/stats', (req, res, next) => controller.getStats(req, res, next));

// Delete account (must be last to avoid conflicts with other routes)
router.delete('/:id', (req, res, next) => controller.deleteAccount(req, res, next));

export default router;
