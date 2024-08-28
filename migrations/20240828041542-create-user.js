"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "firstName must be not empty.",
          },
        },
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "lastName must be not empty.",
          },
        },
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "userName must be not empty.",
          },
        },
      },
      email: {
        type: Sequelize.STRING,
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
        type: Sequelize.STRING,
      },
      gender: {
        type: Sequelize.STRING,
        validate: {
          isIn: {
            args: [["Male", "Female", "Other"]],
            msg: "gender must be Male, Female or Other.",
          },
        },
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Password must be not empty.",
          },
        },
      },
      role: {
        type: Sequelize.STRING,
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
        type: Sequelize.STRING,
        validate: {
          isUrl: {
            msg: "profilePicture must be in URL fomat.",
          },
        },
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};
