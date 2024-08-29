"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Post.belongsTo(models.users, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
      Post.hasMany(models.likes, {
        foreignKey: "postId",
        onDelete: "CASCADE",
      });
      Post.hasMany(models.comments, {
        foreignKey: "postId",
        onDelete: "CASCADE",
      });
      Post.hasMany(models.postmedias, {
        foreignKey: "postId",
        onDelete: "CASCADE",
        as: "mediaContent",
      });
      Post.hasOne(models.bookmarks, {
        foreignKey: "postId",
        onDelete: "CASCADE",
        as: "bookmarkedPost",
      });
    }
  }
  Post.init(
    {
      caption: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Caption is required.",
          },
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "UserId is required.",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "posts",
      tableName: "posts",
      freezeTableName: true,
      timestamps: true,
    }
  );
  return Post;
};
