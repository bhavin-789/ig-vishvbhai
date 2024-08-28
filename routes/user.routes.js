const { Router } = require("express");
const userCtrl = require("../controllers/user.controller.js");
const { auth } = require("../middlewares/auth.middleware.js");
const { uploadProfilePic } = require("../middlewares/multerConfig.js");
const userRouter = Router();

userRouter.post("/signup", userCtrl.signup);
// userRouter.get("/", auth, userCtrl.getUsers);
userRouter.get("/profile/:id", auth, userCtrl.getUserProfile);
// userRouter.delete("/:id", auth, userCtrl.deleteUser);
userRouter.put(
  "/profile/edit",
  auth,
  uploadProfilePic.single("profilePic"),
  userCtrl.updateUserProfile
);
// userRouter.delete("/soft-delete", userCtrl.deleteUsersAsSoft);
// userRouter.delete("/hard-delete", userCtrl.deleteUsersAsHard);
// userRouter.get("/restore", userCtrl.restoreSafelyDeletedUser);
userRouter.post("/login", userCtrl.logIn);
userRouter.post("/new-access-token", userCtrl.newAccessToken);
userRouter.post("/send-email", userCtrl.sendEmail);
userRouter.post("/verify-otp", userCtrl.verifyOTP);
userRouter.put("/change-password", userCtrl.changePassword);

module.exports = userRouter;
