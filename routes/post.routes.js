const { Router } = require("express");
const { auth } = require("../middlewares/auth.middleware.js");
const { uploadMultipleMedias } = require("../middlewares/multerConfig.js");
const postCtrl = require("../controllers/post.controller.js");
const postRouter = Router();

postRouter.post(
  "/create",
  auth,
  uploadMultipleMedias.array("postMedias", 10),
  postCtrl.createPost
);
postRouter.get("/like/:postId", auth, postCtrl.likeAPost);
postRouter.get("/dislike/:postId", auth, postCtrl.disLikeAPost);
postRouter.get("/like-dislike/:postId", auth, postCtrl.likeOrDislike);
postRouter.post("/add-comment/:postId", auth, postCtrl.addAComment);
postRouter.delete("/delete-comment/:commentId", auth, postCtrl.deleteAComment);
postRouter.get("/bookmark-post/:postId", auth, postCtrl.bookmarkThePost);

module.exports = postRouter;
