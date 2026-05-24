require('dotenv').config();
const sequelize = require('../db');
const { CarType } = require('../models');

const SEED = [
    { name: 'Sedan',             icon: 'car-sedan',  max_weight: 500,   dim_x: 1.20, dim_y: 1.00, dim_z: 0.60 },
    { name: 'Pikap',             icon: 'car-pickup', max_weight: 1000,  dim_x: 2.50, dim_y: 1.60, dim_z: 0.80 },
    { name: 'Furgon',            icon: 'car-van',    max_weight: 2000,  dim_x: 3.50, dim_y: 1.80, dim_z: 1.90 },
    { name: 'Yuk mashinasi (5t)',icon: 'car-truck',  max_weight: 5000,  dim_x: 6.00, dim_y: 2.40, dim_z: 2.50 },
    { name: 'TIR',               icon: 'car-tir',    max_weight: 20000, dim_x: 13.60,dim_y: 2.45, dim_z: 2.70 },
];

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB ulanish OK');

        let created = 0;
        let skipped = 0;
        for (const row of SEED) {
            const [, isNew] = await CarType.findOrCreate({
                where: { name: row.name },
                defaults: row,
            });
            if (isNew) { created++; console.log('+ qo\'shildi:', row.name); }
            else { skipped++; console.log('= mavjud, o\'tkazildi:', row.name); }
        }

        console.log(`\n📊 Yakuniy: ${created} ta yangi, ${skipped} ta mavjud`);
        const total = await CarType.count();
        console.log(`📦 CarType jadvalida jami: ${total} ta yozuv`);

        await sequelize.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed xatolik:', err);
        process.exit(1);
    }
})();
