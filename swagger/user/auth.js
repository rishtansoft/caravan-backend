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

/**
 * @swagger
 * /api/auth/password-reset/send-code:
 *   post:
 *     summary: Request an SMS code for password reset
 *     description: User provides their phone number to request an SMS code for resetting their password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: User's registered phone number
 *                 example: "+1234567890"
 *     responses:
 *       '200':
 *         description: SMS code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 id:
 *                   type: integer
 *                 message:
 *                   type: string
 *                   example: "SMS code sent successfully."
 *       '400':
 *         description: Bad request or validation error
 */

/**
 * @swagger
 * /api/auth/password-reset/verify-code:
 *   post:
 *     summary: Verify the SMS code for password reset
 *     description: Verify the SMS code sent to the user's phone number for password reset.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID returned when the SMS code was requested
 *               code:
 *                 type: string
 *                 description: The SMS code sent to the user's phone
 *                 example: "123456"
 *     responses:
 *       '200':
 *         description: SMS code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 user_id:
 *                   type: integer
 *                 message:
 *                   type: string
 *                   example: "SMS code verified successfully."
 *       '400':
 *         description: Invalid SMS code or other validation errors
 */

/**
 * @swagger
 * /api/auth/password-reset/new-password:
 *   post:
 *     summary: Reset the user's password
 *     description: Allows the user to reset their password after verifying the SMS code.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: User's ID after verifying SMS code
 *               new_password:
 *                 type: string
 *                 description: The new password for the user
 *                 example: "newPassword123"
 *               password_rep:
 *                 type: string
 *                 description: Repeat the new password for confirmation
 *                 example: "newPassword123"
 *     responses:
 *       '200':
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully."
 *       '400':
 *         description: Validation error or mismatch in passwords
 */

/**
 * @swagger
 * /api/auth/password-reset/resend-code:
 *   post:
 *     summary: Resend the SMS code for password reset
 *     description: Allows the user to request another SMS code if they didn't receive the first one.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID returned when the SMS code was requested
 *               phone:
 *                 type: string
 *                 description: The phone number for which the SMS code should be resent
 *                 example: "+1234567890"
 *     responses:
 *       '200':
 *         description: SMS code resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SMS code resent successfully."
 *       '400':
 *         description: Bad request or validation error
 */
