"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Bookmark extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Bookmark.belongsTo(models.users, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }
  Bookmark.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "User id must be required.",
          },
        },
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Post id must be required.",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "bookmarks",
      tableName: "bookmarks",
      freezeTableName: true,
      timestamps: true,
    }
  );
  return Bookmark;
};
