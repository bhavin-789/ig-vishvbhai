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

exports.getSinglePostById = async (req, res) => {
  const { postId } = req.params;
  try {
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "Post Id is required." });
    }
    const findPost = await db.posts.findOne({
      where: {
        id: postId,
      },
      attributes: ["id", "caption"],
      include: [
        {
          model: db.postmedias,
          as: "mediaContent",
          attributes: ["id", "mediaType", "mediaURL"],
        },
      ],
    });

    if (!findPost) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Post Id" });
    }

    return res.status(200).json({
      success: true,
      message: "Post fetched successfully.",
      data: findPost,
    });
  } catch (error) {
    console.log("Error while fetching single post", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const fetchdAllPosts = await db.posts.findAll({
      attributes: ["id", "caption"],
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: db.postmedias,
          as: "mediaContent",
          attributes: ["id", "mediaType", "mediaURL", "order"],
        },
      ],
    });
    if (!fetchdAllPosts.length) {
      return res
        .status(404)
        .json({ success: false, message: "No Posts found!" });
    }
    return res.status(200).json({
      success: true,
      message: "All Posts fetched successfully.",
      data: fetchdAllPosts,
    });
  } catch (error) {
    console.log("Error while fetching all the posts", error);
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

exports.bookmarkThePost = async (req, res) => {
  const { postId } = req.params;
  const { id: userId } = req.user;
  try {
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "Post ID is required." });
    }

    const findBookmarkedPost = await db.bookmarks.findOne({
      where: { postId, userId },
    });

    if (findBookmarkedPost) {
      const removedBookmarkedPost = await findBookmarkedPost.destroy();
      if (removedBookmarkedPost) {
        return res.status(200).json({
          success: true,
          message: "Post removed from bookmark successfully.",
        });
      }
    } else {
      const bookmarkedPost = await db.bookmarks.create({ postId, userId });
      if (bookmarkedPost) {
        return res
          .status(200)
          .json({ success: true, message: "Post bookmarked successfully." });
      }
    }

    return res
      .status(500)
      .json({ success: false, message: "Something went wrong!" });
  } catch (error) {
    console.log("Error while bookmarking the Post.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getUsersBookmarkedPost = async (req, res) => {
  const { id: userId } = req.user;
  try {
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated." });
    }
    const findBookmakedPost = await db.bookmarks.findAll({
      where: { userId },
      attributes: ["id", "userId", "postId"],
      include: [
        {
          model: db.posts,
          as: "bookmarkedPost",
          attributes: ["id", "caption"],
          include: [
            {
              model: db.postmedias,
              as: "mediaContent",
              attributes: ["id", "mediaURL", "order"],
            },
          ],
        },
      ],
    });
    if (!findBookmakedPost.length) {
      return res
        .status(404)
        .json({ success: false, message: "User has no bookmarked post yet!" });
    } else {
      return res.status(200).json({
        success: true,
        data: findBookmakedPost,
        message: "Fetched bookmarked post successfully.",
      });
    }
  } catch (error) {
    console.log("Error while fetching bookmarked Posts.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
