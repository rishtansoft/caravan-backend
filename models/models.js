const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize) => {
  // Asosiy model
  class BaseModel extends Model {
    static init(attributes, options) {
      super.init(
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          status: {
            type: DataTypes.ENUM("active", "inactive"),
            defaultValue: "active",
          },
          ...attributes,
        },
        {
          sequelize,
          timestamps: true,
          ...options,
        }
      );
    }
  }

  class Users extends BaseModel {
    static associate(models) {
      Users.hasOne(models.Driver, { foreignKey: "user_id" });
      Users.hasMany(models.Load, { foreignKey: "user_id" });
      Users.hasMany(models.Notification, { foreignKey: "user_id" });
      Users.hasMany(models.UserRegister, { foreignKey: "user_id" });
    }
  }

  Users.init(
    {
      unique_id: {
        type: DataTypes.STRING, // yoki INTEGER, agar siz raqamli bo'lishini xohlasangiz
        allowNull: true,
        unique: true, // noyob qilib belgilash
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userid: {
        type: DataTypes.STRING,
        unique: true,
      },
      lastname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          is: /^\+?[1-9]\d{1,14}$/,
        },
      },
      phone_2: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^\+?[1-9]\d{1,14}$/,
        },
      },
      birthday: DataTypes.DATEONLY,
      user_img: DataTypes.STRING,
      address: DataTypes.STRING,
      role: {
        type: DataTypes.ENUM("driver", "cargo_owner", "admin"),
        allowNull: true,

      },
      user_status: {
        type: DataTypes.ENUM("pending", "active", "inactive", "confirm_phone"),
        defaultValue: "confirm_phone",
      },
      verification_code: DataTypes.STRING,
      verification_expiry: DataTypes.DATE,
      email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
    },
    {
      sequelize,
      modelName: "Users",
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  class Driver extends BaseModel {
    static associate(models) {
      Driver.belongsTo(models.Users, {
        foreignKey: "user_id",
        targetKey: "id",
      });
      Driver.hasMany(models.Assignment, { foreignKey: "driver_id" });
      Driver.belongsTo(CarType, { foreignKey: 'car_type_id', as: 'carType' });
    }
  }

  Driver.init(
    {
      car_type_id: {
        type: DataTypes.UUID,
        references: {
          model: "CarType",
          key: 'id',
        },
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },

      tex_pas_ser: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prava_ser: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tex_pas_num: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prava_num: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      car_img: DataTypes.STRING,
      prava_img: DataTypes.STRING,
      tex_pas_img: DataTypes.STRING,
      driver_status: {
        type: DataTypes.ENUM(
          "empty",
          "at_work",
          "resting",
          "offline",
          "on_break"
        ),
        defaultValue: "offline",
      },
      is_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: "Driver", // jadval nomini majburlash
    }
  );

  class CarType extends BaseModel {
    static associate(models) {

    }
  }

  CarType.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      max_weight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dim_x: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      dim_y: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      dim_z: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "CarType",
    }
  );

  // Load modeli
  class Load extends BaseModel {
    static associate(models) {
      Load.belongsTo(models.Users, { foreignKey: "user_id" });
      Load.hasOne(models.Assignment, { foreignKey: "load_id" });
    }
  }

  Load.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: "Users",
          key: "id",
        },
      },
      name: DataTypes.STRING,
      cargo_type: DataTypes.STRING,
      receiver_phone: DataTypes.STRING,
      payer: {
        type: DataTypes.ENUM("sender", "receiver", "third_party"),
        allowNull: false,
      },
      description: DataTypes.TEXT,
      load_status: {
        type: DataTypes.ENUM(
          "posted", // yangi yuk elon qilingan
          "assigned", // haydovchiga tayinlangan
          "picked_up", // yuklangmoqda
          "in_transit", // yolda
          "delivered", // yetkazildi
        ),
        defaultValue: "posted",
      },
    },
    {
      sequelize,
      tableName: "Load",
    }
  );


  class Location extends BaseModel {
    static associate(models) {
      Location.belongsTo(models.Load, { foreignKey: "load_id" });
    }
  }

  Location.init({
    load_id: {
      type: DataTypes.UUID,
      references: {
        model: "Load",
        key: "id",
      },
    },
    location_type: { // 'origin', 'stop', 'destination'
      type: DataTypes.ENUM("origin", "stop", "destination"),
    },
    address: DataTypes.STRING,
    lat: {
      type: DataTypes.FLOAT,
      validate: {
        min: -90,
        max: 90,
      },
    },
    lon: {
      type: DataTypes.FLOAT,
      validate: {
        min: -180,
        max: 180,
      },
    },
  }, {
    sequelize,
    tableName: "Locations",
  });

  class LoadDetails extends BaseModel {
    static associate(models) {
      LoadDetails.belongsTo(models.Load, { foreignKey: "load_id" });
      LoadDetails.belongsTo(models.CarType, { foreignKey: "car_type_id" });
    }
  }
  
  LoadDetails.init({
    load_id: {
      type: DataTypes.UUID,
      references: {
        model: "Load",
        key: "id",
      },
    },
    weight: {
      type: DataTypes.FLOAT,
      validate: {
        min: 0,
      },
    },
    length: {
      type: DataTypes.FLOAT,
      validate: {
        min: 0,
      },
    },
    width: {
      type: DataTypes.FLOAT,
      validate: {
        min: 0,
      },
    },
    height: {
      type: DataTypes.FLOAT,
      validate: {
        min: 0,
      },
    },
    car_type_id: {
      type: DataTypes.UUID,
      references: {
        model: "CarType",
        key: "id",
      },
    },
    loading_time: DataTypes.DATE,
  }, {
    sequelize,
    tableName: "LoadDetails",
  });

  // Assignment modeli
  class Assignment extends BaseModel {
    static associate(models) {
      Assignment.belongsTo(models.Driver, { foreignKey: 'driver_id' });
      Assignment.belongsTo(models.Load, { foreignKey: 'load_id' });
      Assignment.hasMany(models.Location);
      Assignment.hasMany(models.DriverStop);
    }
  }

  Assignment.init(
    {
      load_id: {
        type: DataTypes.UUID,
        references: {
          model: "Load",
          key: "id",
        },
      },
      driver_id: {
        type: DataTypes.UUID,
        references: {
          model: "Driver",
          key: "id",
        },
      },
      assignment_status: {
        type: DataTypes.ENUM(
          "assigned",
          "picked_up",
          "in_transit",
          "delivered"
        ),
        defaultValue: "assigned",
      },
      pickUpTime: DataTypes.DATE,
      deliveryTime: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "Assignment",
    }
  );
  


  // DriverStop modeli
  class DriverStop extends BaseModel {
    static associate(models) {
      DriverStop.belongsTo(models.Assignment);
    }
  }

  DriverStop.init({
    assignment_id: {
      type: DataTypes.UUID,
      references: {
        model: "Assignment",
        key: "id",
      },
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  });

  // LocationCron modeli
  class LocationCron extends BaseModel {
    static associate(models) {
      LocationCron.belongsTo(models.Assignment);
    }
  }

  LocationCron.init({
    assignment_id: {
      type: DataTypes.UUID,
      references: {
        model: "Assignment",
        key: "id",
      },
    },
    time: DataTypes.DATE,
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  });

  // Notification modeli
  class Notification extends BaseModel {
    static associate(models) {
      Notification.belongsTo(models.Users);
      Notification.belongsTo(models.Load);
    }
  }

  Notification.init({
    load_id: {
      type: DataTypes.UUID,
      references: {
        model: "Load",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: "Users",
        key: "id",
      },
    },
    message: DataTypes.TEXT,
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  });

  class UserRegister extends BaseModel {
    static associate(models) {
      // Foydalanuvchi bilan bog'lanish (UserRegister foydalanuvchi jadvali bilan bog'lanadi)
      UserRegister.belongsTo(models.Users, { foreignKey: "user_id" });
    }
  }

  UserRegister.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false, // Kod bo'sh bo'lmasligi kerak
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false, // Foydalanuvchi ID bo'lishi shart
        references: {
          model: "Users",
          key: "id",
        },
      },
      expiration: {
        type: DataTypes.DATE, // Kod muddati uchun to'g'ri tip (DATE)
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
        defaultValue: DataTypes.NOW, // Yangilanish vaqti
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: DataTypes.NOW, // Yaratilgan vaqti
      },
    },
    {
      sequelize,
      tableName: "user_registers",
      timestamps: true, // Sequelize avtomatik tarzda vaqt muhrlarini boshqaradi
    }
  );


  Users.associate = (models) => {
    Users.hasOne(models.Driver);
    Users.hasMany(models.Load);
    Users.hasMany(models.Notification);
    Users.hasMany(models.UserRegister, { foreignKey: "user_id" });
  };

  Driver.associate = (models) => {
    Driver.belongsTo(models.Users);
    Driver.hasMany(models.Assignment);
  };

  Load.associate = (models) => {
    Load.belongsTo(models.Users);
    Load.hasOne(models.Assignment);
  };

  return {
    Users,
    Driver,
    Load,
    Assignment,
    Location,
    DriverStop,
    LocationCron,
    Notification,
    UserRegister,
    CarType
  };
};
