"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "profilePicture", {
      type: Sequelize.STRING,
      validate: {
        isUrl: {
          msg: "profilePicture must be in URL fomat.",
        },
      },
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "profilePicture", {
      type: Sequelize.STRING,
      validate: {
        isUrl: {
          msg: "profilePicture must be in URL fomat.",
        },
      },
    });
  },
};
