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
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
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
            Driver.hasMany(models.Assignment, { foreignKey: "driver_id", onDelete: 'CASCADE', });
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
            CarType.hasMany(LoadDetails, { foreignKey: 'car_type_id' });
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
            Load.belongsTo(models.Users, { foreignKey: "user_id" , onDelete: 'CASCADE',});
            Load.hasOne(models.Assignment, { foreignKey: "load_id" });

            Load.hasMany(models.Location, { foreignKey: 'load_id' });
            Load.hasMany(models.Driver, { foreignKey: 'load_id' });

            Load.hasOne(models.LoadDetails, {
                foreignKey: 'load_id', // LoadDetails modelidagi foreignKey
                as: 'loadDetails', // alias nomi
            });
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
                    "in_transit_get_load", // yukni olishga yolda kelyapti
                    "arrived_picked_up", // yukni olishga yetib keldi
                    "picked_up", // yuklangmoqda
                    "in_transit", // yolda
                    "delivered", // yetkazildi
                ),
                defaultValue: "posted",
            },
            is_round_trip: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: true
            }
        },
        {
            sequelize,
            tableName: "Load",
        }
    );

    class LoadDetails extends BaseModel {
        static associate(models) {
            LoadDetails.belongsTo(models.Load, {
                foreignKey: 'load_id',
                as: 'load', // alias nomi
            });
            LoadDetails.belongsTo(CarType, { foreignKey: 'car_type_id' });
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
            allowNull: true
        },
        length: {
            type: DataTypes.FLOAT,
            validate: {
                min: 0,
            },
            allowNull: true
        },
        width: {
            type: DataTypes.FLOAT,
            validate: {
                min: 0,
            },
            allowNull: true
        },
        height: {
            type: DataTypes.FLOAT,
            validate: {
                min: 0,
            },
            allowNull: true
        },
        car_type_id: {
            type: DataTypes.UUID,
            references: {
                model: "CarType",
                key: "id",
            },
        },
        loading_time: DataTypes.FLOAT,
    }, {
        sequelize,
        tableName: "LoadDetails",
    });

    // Assignment modeli
    class Assignment extends BaseModel {
        static associate(models) {
            Assignment.belongsTo(models.Driver, { foreignKey: 'driver_id', onDelete: 'CASCADE', });
            Assignment.belongsTo(models.Load, { foreignKey: 'load_id', onDelete: 'CASCADE', });
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
                    "arrived_picked_up", // yukni olishga yetib keldi
                    "in_transit_get_load", // yukni olishga yolda kelyapti
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
            DriverStop.belongsTo(models.Load, { foreignKey: "load_id" });
        }
    }

    DriverStop.init({
        load_id: {
            type: DataTypes.UUID,
            references: {
                model: "Load",  // Assignment o'rniga Load
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false,
            validate: {
                min: -90,
                max: 90,
            },
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false,
            validate: {
                min: -180,
                max: 180,
            },
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1 // 0 -> boshlangich, 1 -> tugash,
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        location_name: {
            type: DataTypes.STRING
        }
    });

    class Location extends Model {
        static associate(models) {
            Location.belongsTo(models.Load, {
                foreignKey: 'load_id',
                as: 'load'
            });
        }
    }

    Location.init({
        load_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Load',
                key: "id",
            },
            onDelete: 'CASCADE',
        },
        recordedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false,
            validate: {
                min: -90,
                max: 90,
            },
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false,
            validate: {
                min: -180,
                max: 180,
            },
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    }, {
        sequelize,
        modelName: 'Location',
        indexes: [
            {
                fields: ['load_id', 'order'],
                unique: true, // unique constraint for assignment_id and order combination
            },
            {
                fields: ['recordedAt'],
            },
        ],
        hooks: {
            beforeCreate: async (location, options) => {
                // Increment order for each new entry related to the same assignment_id
                const lastLocation = await Location.findOne({
                    where: { load_id: location.load_id },
                    order: [['order', 'DESC']],
                });
                location.order = lastLocation ? lastLocation.order + 1 : 1;
            }
        }
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
            timestamps: true, 
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
        Notification,
        UserRegister,
        CarType,
        LoadDetails
    };
};
