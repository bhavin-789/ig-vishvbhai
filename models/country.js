"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Country extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Country.init(
    {
      countryName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Country name is required.",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "countries",
      tableName: "countries",
      freezeTableName: true,
      timestamps: true,
    }
  );
  return Country;
};
