"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class otp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  otp.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Email must be not empty.",
          },
        },
      },
      otp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Otp must be not empty.",
          },
        },
      },
      expiresIn: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: new Date().getTime() + 5 * 60 * 1000,
        validate: {
          notNull: {
            msg: "expiresiIn must be not empty.",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "otp",
      timestamps: false,
      freezeTableName: true,
      tableName: "otp",
    }
  );
  return otp;
};
