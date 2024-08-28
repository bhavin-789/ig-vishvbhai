"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.posts, { foreignKey: "userId", onDelete: "CASCADE" });
      User.hasMany(models.bookmarks, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }
  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "firstName must be not empty.",
          },
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "lastName must be not empty.",
          },
        },
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "userName must be not empty.",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: {
            msg: "Email must be valid.",
          },
          notNull: {
            msg: "Email must be not empty.",
          },
        },
      },
      bio: {
        type: DataTypes.STRING,
      },
      gender: {
        type: DataTypes.STRING,
        validate: {
          isIn: {
            args: [["Male", "Female", "Other"]],
            msg: "gender must be Male, Female or Other.",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Password must be not empty.",
          },
        },
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
        validate: {
          isIn: {
            args: [["user", "admin"]],
            msg: "Role must be user or admin",
          },
          notNull: {
            msg: "Role must be not empty.",
          },
        },
      },
      profilePicture: {
        type: DataTypes.STRING,
        validate: {
          isUrl: {
            msg: "profilePicture must be in URL fomat.",
          },
        },
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "users",
      tableName: "users",
      paranoid: true,
      freezeTableName: true,
    }
  );
  return User;
};
