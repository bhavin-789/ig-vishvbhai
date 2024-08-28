const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const express = require("express");
const userRouter = require("./routes/user.routes.js");
const db = require("./models");
const postRouter = require("./routes/post.routes.js");

const port = process.env.APP_PORT;
const app = express();

app.use(express.json());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);

db.sequelize
  .authenticate()
  .then(() => console.log("DataBase Connected Successfully."))
  .catch((error) => console.log("DataBase Connection Failed.", error));

// db.sequelize
//   .sync({ alter: true })
//   .then(() => console.log("models are synced successfully."))
//   .catch(() => console.log("Error while syncing the models."));

app.listen(port, () =>
  console.log(`⚙ Server is running at http://localhost:${port}`)
);
