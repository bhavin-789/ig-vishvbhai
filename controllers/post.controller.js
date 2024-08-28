const db = require("../models");

exports.createPost = async (req, res) => {
  const { caption } = req.body;
  const userId = req.user.id;
  const postImagesUrls = req.files.map((file) => file.path);

  try {
    if (!caption || !userId || !postImagesUrls.length) {
      return res.status(400).json({
        success: false,
        message: "Caption and post image/s are required.",
      });
    }
    const newPost = await db.posts.create({ caption, userId });

    req.files.map(async (file, index) => {
      const afterSplited = file.path.split(".");
      const urlExtension = afterSplited[afterSplited.length - 1];
      let mediaType;
      if (
        urlExtension === "png" ||
        urlExtension === "jpg" ||
        urlExtension === "jpeg"
      ) {
        mediaType = "image";
      } else if (
        urlExtension === "mp4" ||
        urlExtension === "mov" ||
        urlExtension === "avi" ||
        urlExtension === "mkv"
      ) {
        mediaType = "video";
      }

      await db.postmedias.create({
        mediaURL: file.path,
        userId,
        postId: newPost.id,
        mediaType,
        order: index + 1,
      });
    });

    return res
      .status(201)
      .json({ success: true, message: "Post created successfully." });
  } catch (error) {
    console.log("Error while creating the post", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.likeAPost = async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;
  try {
    const findPostWithLike = await db.likes.findOne({
      where: { postId, userId },
    });

    if (findPostWithLike) {
      return res
        .status(200)
        .json({ success: true, message: "Already liked this post." });
    }

    await db.likes.create({ postId, userId });
    return res
      .status(200)
      .json({ success: true, message: "Post liked successfully." });
  } catch (error) {
    console.log("Error while liking the post", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.disLikeAPost = async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;
  try {
    const findPostWithLike = await db.likes.findOne({
      where: { postId, userId },
    });

    if (findPostWithLike) {
      await db.likes.destroy({ where: { postId, userId } });
      return res
        .status(200)
        .json({ success: true, message: "Post disliked successfully." });
    }

    return res
      .status(200)
      .json({ success: true, message: "This post doesn't liked yet." });
  } catch (error) {
    console.log("Error while disliking the post", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.likeOrDislike = async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;
  try {
    let findPostWithLike = await db.likes.findOne({
      where: { postId, userId },
    });

    if (findPostWithLike) {
      await findPostWithLike.destroy();
      return res
        .status(200)
        .json({ success: true, message: "Post disliked successfully." });
    }

    const makeALike = await db.likes.create({ postId, userId });
    if (makeALike) {
      return res
        .status(200)
        .json({ success: true, message: "Post liked successfully." });
    }
  } catch (error) {
    console.log("Error while like-dislike toggling the post", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.addAComment = async (req, res) => {
  const { postId } = req.params;
  const { commentText } = req.body;
  const userId = req.user.id;
  try {
    if (!postId || !commentText) {
      return res.status(400).json({
        success: false,
        message: "Comment Text and Post Id are required.",
      });
    }
    const makeAComment = await db.comments.create({
      postId,
      commentText,
      userId,
    });

    if (makeAComment) {
      return res
        .status(400)
        .json({ success: true, message: "Comment added successfully." });
    }
  } catch (error) {
    console.log("Error while adding comment to the post", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteAComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  try {
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: "Comment Id is required.",
      });
    }

    const findAComment = await db.comments.findOne({
      where: { id: commentId, userId },
    });

    if (!findAComment) {
      return res.status(400).json({
        success: false,
        message: "You can't delete other user's comment.",
      });
    }

    const removeAComment = await findAComment.destroy();

    if (removeAComment) {
      return res
        .status(200)
        .json({ success: true, message: "Comment removed successfully." });
    }
  } catch (error) {
    console.log("Error while removing comment.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.bookmarkThePost = async (req, res) => {};
