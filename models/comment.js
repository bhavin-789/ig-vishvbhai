"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Comment.belongsTo(models.posts, {
        foreignKey: "postId",
        onDelete: "CASCADE",
      });
    }
  }
  Comment.init(
    {
      commentText: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Comment text must be required.",
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
      modelName: "comments",
      tableName: "comments",
      freezeTableName: true,
      timestamps: true,
    }
  );
  return Comment;
};
