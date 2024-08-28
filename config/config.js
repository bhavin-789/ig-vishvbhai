const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  development: {
    username: process.env.DEV_USERNAME,
    password: process.env.DEV_PASSWORD,
    database: process.env.DEV_DATABASE,
    host: process.env.DEV_HOST,
    port: process.env.DEV_PORT,
    dialect: process.env.DEV_DIALECT,
    logging: false,
    // logging: console.log,
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: process.env.PROD_USERNAME,
    password: process.env.PROD_PASSWORD,
    database: process.env.PROD_DATABASE,
    host: process.env.PROD_HOST,
    port: process.env.PROD_PORT,
    dialect: process.env.PROD_DIALECT,
    logging: false,
  },
};
