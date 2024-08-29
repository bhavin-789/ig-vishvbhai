"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  City.init(
    {
      cityName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "City name must be required.",
          },
        },
      },
      stateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "State id must be required.",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "cities",
      tableName: "cities",
      freezeTableName: true,
      timestamps: true,
    }
  );
  return City;
};
