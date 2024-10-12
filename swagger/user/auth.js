
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The user ID
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         birthday:
 *           type: string
 *         user_img:
 *           type: string
 *         address:
 *           type: string
 *         role:
 *           type: string
 *           description: The role of the user (e.g., 'driver', 'admin', etc.)
 */

/**
 * @swagger
 * /auth/register/initial:
 *   post:
 *     summary: Initial registration of the user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *               - lastname
 *               - firstname
 *               - password_rep
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               password_rep:
 *                 type: string
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Initial registration successful
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /auth/register/complete:
 *   post:
 *     summary: Complete user registration
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_2
 *               - birthday
 *               - role
 *             properties:
 *               phone_2:
 *                 type: string
 *               birthday:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration complete. Verify phone number.
 *       400:
 *         description: Invalid input or phone number formatting
 */

/**
 * @swagger
 * /auth/verify-phone:
 *   post:
 *     summary: Verify user phone number with a code
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - code
 *             properties:
 *               user_id:
 *                 type: integer
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone number verified successfully
 *       400:
 *         description: Invalid or expired verification code
 */