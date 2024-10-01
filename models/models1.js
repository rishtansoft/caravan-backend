const { DataTypes, Model } = require("sequelize");
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  // Asosiy model
  class BaseModel extends Model {
    static init(attributes, options) {
      super.init({
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          defaultValue: 'active',
        },
        ...attributes
      }, {
        sequelize,
        timestamps: true,
        ...options
      });
    }
  }

  // Users modeli
  class Users extends BaseModel {
    static associate(models) {
      Users.hasOne(models.Driver);
      Users.hasMany(models.Load);
      Users.hasMany(models.Notification);
    }

    static hooks = {
      // Foydalanuvchi yaratilgandan keyin driver va load yozuvlarini yaratish
      afterCreate: async (user, options) => {
        const { Driver, Load } = sequelize.models;

        if (user.role === 'driver') {
          // Foydalanuvchi driver bo'lsa, driver yaratish
          await Driver.create({
            user_id: user.id,
            name: `${user.firstname} ${user.lastname}`,
          });
        }

        if (user.role === 'cargo_owner') {
          // Foydalanuvchi cargo_owner bo'lsa, load yaratish
          await Load.create({
            user_id: user.id,
            name: 'Yangi yuk',
          });
        }
      },
    };
  }

  Users.init({
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('password', bcrypt.hashSync(value, 10));
      }
    },
    userid: {
      type: DataTypes.STRING,
      unique: true,
    },
    lastname: DataTypes.STRING,
    firstname: DataTypes.STRING,
    phone: {
      type: DataTypes.STRING,
      unique: true, // Telefon raqam bir martalik bo'lishi kerak
      validate: {
        is: /^\+?[1-9]\d{1,14}$/
      }
    },
    phone_2: {
      type: DataTypes.STRING,
      validate: {
        is: /^\+?[1-9]\d{1,14}$/
      }
    },
    birthday: DataTypes.DATEONLY,
    user_img: DataTypes.STRING, // fayl yo'li
    address: DataTypes.STRING,
    role: {
      type: DataTypes.ENUM('driver', 'cargo_owner', 'admin'), // Admin ham rolega qo'shildi
      allowNull: false,
    },
    user_status: {
      type: DataTypes.ENUM('pending', 'active', 'inactive', 'confirm_phone'),
      defaultValue: "confirm_phone"
    },
    verification_code: DataTypes.STRING,
    verification_expiry: DataTypes.DATE,
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      }
    },
  });

  // Driver modeli
  class Driver extends BaseModel {
    static associate(models) {
      Driver.belongsTo(models.Users);
      Driver.hasMany(models.Assignment);
    }
  }

  Driver.init({
    car_type: DataTypes.STRING,
    name: DataTypes.STRING,
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    tex_pas_ser: DataTypes.STRING,
    prava_ser: DataTypes.STRING,
    tex_pas_num: DataTypes.STRING,
    prava_num: DataTypes.STRING,
    car_img: DataTypes.STRING, // fayl yo'li
    prava_img: DataTypes.STRING, // fayl yo'li
    tex_pas_img: DataTypes.STRING, // fayl yo'li
    driver_status: {
      type: DataTypes.ENUM('empty', 'at_work', 'resting', 'offline', 'on_break'),
      defaultValue: 'offline'
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Yangi maydon qo'shildi, admin tomonidan tasdiqlangan yoki yo'q
    },
    blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Haydovchi bloklangan yoki yo'q
    },
  });

  // Load modeli
  class Load extends BaseModel {
    static associate(models) {
      Load.belongsTo(models.Users);
      Load.hasOne(models.Assignment);
    }
  }

  Load.init({
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    name: DataTypes.STRING,
    cargo_type: DataTypes.STRING,
    weight: DataTypes.FLOAT,
    length: DataTypes.FLOAT,
    width: DataTypes.FLOAT,
    height: DataTypes.FLOAT,
    load_img: DataTypes.STRING, // fayl yo'li
    load_status: {
      type: DataTypes.ENUM('posted', 'assigned', 'picked_up', 'in_transit', 'delivered'),
      defaultValue: 'posted'
    },
  });

  // Modelni qaytarish
  return {
    Users,
    Driver,
    Load,
  };
};
