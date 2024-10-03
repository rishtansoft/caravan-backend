/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with required details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lastname:
 *                 type: string
 *               firstname:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               password_rep:
 *                 type: string
 *               role:
 *                 type: string
 *             example:
 *               lastname: Doe
 *               firstname: John
 *               phone: "+1234567890"
 *               password: "password"
 *               password_rep: "password"
 *               role: "user"
 *     responses:
 *       '200':
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 id:
 *                   type: integer
 *                 phone:
 *                   type: string
 *                 ur_id:
 *                   type: integer
 *                 user_reg:
 *                   type: boolean
 *                   example: true
 *       '400':
 *         description: Bad request or validation error
 */

/**
 * @swagger
 * /api/user/load-add:
 *   post:
 *     summary: Register a new cargo owner
 *     description: Registers a new cargo owner with the necessary details such as name, phone, password, birthday, and address.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               lastname:
 *                 type: string
 *                 description: User's last name
 *                 example: Doe
 *               firstname:
 *                 type: string
 *                 description: User's first name
 *                 example: John
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "password123"
 *               password_rep:
 *                 type: string
 *                 description: Repeat password for confirmation
 *                 example: "password123"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: User's birthday (optional)
 *                 example: "1990-01-01"
 *               address:
 *                 type: string
 *                 description: User's address
 *                 example: "123 Main Street, City, Country"
 *               user_img:
 *                 type: string
 *                 format: binary
 *                 description: User's profile image (optional)
 *     responses:
 *       '200':
 *         description: Cargo owner registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 id:
 *                   type: integer
 *                 phone:
 *                   type: string
 *                 user_reg:
 *                   type: boolean
 *                   example: true
 *       '400':
 *         description: Bad request or validation error
 */
