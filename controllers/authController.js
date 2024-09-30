const { Users } = require('../models/models'); // Foydalanuvchi modeli
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { firstname, lastname, phone, password, role } = req.body;
  
  try {
    // Foydalanuvchi telefon raqami unikal ekanligini tekshirish
    const existingUser = await Users.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan.' });
    }

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10);

    // Foydalanuvchini yaratish
    const newUser = await Users.create({
      firstname,
      lastname,
      phone,
      password: hashedPassword,
      role, // Foydalanuvchi roli ('driver', 'cargo_owner')
      user_status: 'confirm_phone'
    });

    // Token yaratish (JWT)
    const token = jwt.sign({ id: newUser.id, phone: newUser.phone }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tdi',
      token,
      user: {
        id: newUser.id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        phone: newUser.phone,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};
