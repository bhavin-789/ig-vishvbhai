"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PostMedia extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PostMedia.belongsTo(models.posts, {
        foreignKey: "postId",
        onDelete: "CASCADE",
      });
    }
  }
  PostMedia.init(
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
            msg: "User Id must be required.",
          },
        },
      },
      mediaType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Media Type must be required.",
          },
        },
      },
      mediaURL: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Media URL must be required.",
          },
        },
      },
      order: {
        type: DataTypes.INTEGER,
        // allowNull: false,
        // validate: {
        // notNull: {
        // msg: "Order must be required.",
        // },
        // },
      },
    },
    {
      sequelize,
      modelName: "postmedias",
      tableName: "postmedias",
      freezeTableName: true,
      timestamps: true,
    }
  );
  return PostMedia;
};
