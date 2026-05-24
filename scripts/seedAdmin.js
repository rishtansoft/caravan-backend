require('dotenv').config();
const bcrypt = require('bcrypt');
const sequelize = require('../db');
const Admin = require('../models/admin');

const DEFAULT_ADMIN = {
    phone: process.env.SEED_ADMIN_PHONE || '+998900000000',
    firstname: process.env.SEED_ADMIN_FIRSTNAME || 'Super',
    lastname: process.env.SEED_ADMIN_LASTNAME || 'Admin',
    address: process.env.SEED_ADMIN_ADDRESS || 'Toshkent',
    role: 'superadmin',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin123',
};

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB ulanish OK');

        const existing = await Admin.findOne({ where: { phone: DEFAULT_ADMIN.phone } });
        if (existing) {
            console.log(`= Admin allaqachon mavjud: ${DEFAULT_ADMIN.phone} (role: ${existing.role})`);
            await sequelize.close();
            process.exit(0);
        }

        const hashed = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
        const created = await Admin.create({ ...DEFAULT_ADMIN, password: hashed });

        console.log('\n+ Yangi admin yaratildi:');
        console.log(`   ID:       ${created.id}`);
        console.log(`   Phone:    ${created.phone}`);
        console.log(`   Password: ${DEFAULT_ADMIN.password}`);
        console.log(`   Role:     ${created.role}`);
        console.log('\n⚠️  Loginning birinchi marta kirgandan keyin parolingizni o\'zgartiring.');

        await sequelize.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed xatolik:', err);
        process.exit(1);
    }
})();
