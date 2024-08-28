const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

exports.generateToken = async (user, secret_key, time) => {
  return await jwt.sign({ id: user.id, role: user.role }, secret_key, {
    expiresIn: time,
  });
};

exports.mailer = async (email, otp) => {
  // https://stackoverflow.com/questions/45478293/username-and-password-not-accepted-when-using-nodemailer

  // https://myaccount.google.com/lesssecureapps

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: process.env.USEREMAILID, // Your Gmail email address(sender)
      pass: process.env.USERPASSWORD, // Your Gmail app password(sender)
    },
  });

  const mailOptions = {
    from: process.env.USEREMAILID, // Sender's email address
    to: email, // Recipient's email address
    subject: "Sending OTP on email id for reset password", // Subject line
    text: `Your opt is ${otp}. This OTP is valid for next 5 minutes only. Please don't share this OTP to anyone else.`, // Plain text body of the email
  };

  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error while Email sending. ", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

exports.generateOtp = (value) => {
  if (value === 4) {
    return Math.floor(1000 + Math.random() * 9000);
  }
  if (value === 6) {
    return Math.floor(100000 + Math.random() * 900000);
  }
};

exports.hashPassword = async (passwordToHash) => {
  const salt = await bcrypt.genSaltSync(10);
  return await bcrypt.hashSync(passwordToHash, salt);
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage settings for single image upload
exports.profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profilePictures", // Specify the folder for profile pictures
    allowed_formats: ["jpg", "png", "jpeg"], // Specify allowed image formats
    // transformation: [{ width: 500, height: 500, crop: "limit" }], // Optional: Resize or transform the image
  },
});

// Configure storage settings for video upload
exports.videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "postVideos", // Specify the folder for videos
    resource_type: "video", // Specify that the upload is a video
    allowed_formats: ["mp4", "mov", "avi", "mkv"], // Specify allowed video formats
  },
});

// Configure storage settings for multiple image uploads
exports.multipleImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "post-images", // Optional: specify a folder in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"], // Specify allowed image formats
  },
});

// Configure storage settings for multiple images and videos uploads
exports.multipleMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName;
    let resourceType;

    if (file.mimetype.startsWith("image/")) {
      folderName = "postImages"; // Specify folder for images
      resourceType = "image"; // Specify the upload as image
    } else if (file.mimetype.startsWith("video/")) {
      folderName = "postVideos"; // Specify folder for videos
      resourceType = "video"; // Specify the upload as video
    }
    return {
      folder: folderName, // Optional: specify a folder in Cloudinary
      resource_type: resourceType,
      allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "avi", "mkv"], // Specify allowed image and videos formats
    };
  },
});
