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
      Users.hasOne(models.Driver);
      Users.hasMany(models.Load);
      Users.hasMany(models.Notification);
      Users.hasMany(models.UserRegister, { foreignKey: "user_id" });
    }
  }

  Users.init(
    {
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
        allowNull: false,
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

  // Driver modeli
  class Driver extends BaseModel {
    static associate(models) {
      Driver.belongsTo(models.Users);
      Driver.hasMany(models.Assignment);
    }
  }

  Driver.init(
    {
      car_type: DataTypes.STRING,
      name: DataTypes.STRING,
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: "Users",
          key: "id",
        },
      },
      tex_pas_ser: DataTypes.STRING,
      prava_ser: DataTypes.STRING,
      tex_pas_num: DataTypes.STRING,
      prava_num: DataTypes.STRING,
      car_img: DataTypes.STRING, // fayl yo'li
      prava_img: DataTypes.STRING, // fayl yo'li
      tex_pas_img: DataTypes.STRING, // fayl yo'li
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
        defaultValue: false, // Yangi maydon qo'shildi, admin tomonidan tasdiqlangan yoki yo'q
      },
      blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Haydovchi bloklangan yoki yo'q
      },
    },
    {
      sequelize,
      tableName: "Driver", // jadval nomini majburlash
    }
  );

  // Load modeli
  class Load extends BaseModel {
    static associate(models) {
      Load.belongsTo(models.Users);
      Load.hasOne(models.Assignment);
    }
  }

  Load.init(
    {
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: "Users",
          key: "id",
        },
      },
      name: DataTypes.STRING,
      cargo_type: DataTypes.STRING,
      weight: DataTypes.FLOAT,
      length: DataTypes.FLOAT,
      width: DataTypes.FLOAT,
      height: DataTypes.FLOAT,
      load_img: DataTypes.STRING, // fayl yo'li
      load_status: {
        type: DataTypes.ENUM(
          "posted",
          "assigned",
          "picked_up",
          "in_transit",
          "delivered"
        ),
        defaultValue: "posted",
      },
    },
    {
      sequelize,
      tableName: "Load", // jadval nomini majburlash
    }
  );

  // Assignment modeli
  class Assignment extends BaseModel {
    static associate(models) {
      Assignment.belongsTo(models.Driver);
      Assignment.belongsTo(models.Load);
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
      tableName: "Assignment", // jadval nomini majburlash
    }
  );

  // Location modeli
  class Location extends BaseModel {
    static associate(models) {
      Location.belongsTo(models.Assignment);
    }
  }

  Location.init({
    assignment_id: {
      type: DataTypes.UUID,
      references: {
        model: "Assignment",
        key: "id",
      },
    },
    start_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    start_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    end_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    end_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  });

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
      },
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: "Users",
          key: "id",
        },
      },
      time: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
    },
    {
      sequelize,
      tableName: "user_registers",
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
  };
};
