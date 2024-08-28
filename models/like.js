"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Like.belongsTo(models.posts, {
        foreignKey: "postId",
        onDelete: "CASCADE",
      });
    }
  }
  Like.init(
    {
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Post id must be required.",
          },
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "User id must be required.",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "likes",
      tableName: "likes",
      freezeTableName: true,
      timestamps: true,
    }
  );
  return Like;
};
