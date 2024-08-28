const bcrypt = require("bcryptjs");
const db = require("../models");
const {
  generateToken,
  generateOtp,
  mailer,
  hashPassword,
} = require("../utils/utilityFunctions.js");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const findUser = await db.users.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { email: req.body.email },
          { userName: req.body.userName },
        ],
      },
    });

    if (findUser) {
      return res.status(409).json({
        success: false,
        message: "email or username already exists.",
      });
    }

    // const salt = await bcrypt.genSaltSync(10);
    // const hashedPassword = await bcrypt.hashSync(req.body.password, salt);

    const hashedPassword = await hashPassword(req.body.password);

    const newUser = await db.users.create(
      { ...req.body, password: hashedPassword },
      {
        fields: ["firstName", "lastName", "userName", "email", "password"],
      }
    );
    const sanitizedNewUserData = newUser.toJSON();
    delete sanitizedNewUserData.password;
    delete sanitizedNewUserData.deletedAt;
    return res.status(201).json({ success: true, data: sanitizedNewUserData });
  } catch (error) {
    console.error("Error while creating a user", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// exports.getUsers = async (req, res) => {
//   try {
//     const fetchedUsers = await db.users.findAll({});
//     return res.status(200).json({ success: true, data: fetchedUsers });
//   } catch (error) {
//     console.error("Error while fetching all users", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// };

exports.getUserProfile = async (req, res) => {
  try {
    const fetchedUser = await db.users.findByPk(req.params.id);
    if (!fetchedUser) {
      return res
        .status(404)
        .json({ success: true, message: "Invalid user ID." });
    }
    return res.status(200).json({ success: true, data: fetchedUser });
  } catch (error) {
    console.error("Error while fetching a user", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// exports.deleteUser = async (req, res) => {
//   try {
//     const deletedDataLength = await db.users.destroy({
//       where: {
//         id: req.params.id,
//       },
//     });

//     if (deletedDataLength === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Incorrect user ID" });
//     }

//     return res
//       .status(200)
//       .json({ success: true, message: "User deleted Successfullly." });

//     // return res.status(200).json({ success: true, data: fetchedUser });
//   } catch (error) {
//     console.error("Error while deleting a user", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// };

exports.updateUserProfile = async (req, res) => {
  console.log(req.file.path);
  const { bio, gender } = req.body; // also update firstName, lastNme and userName
  const profilePicture = req.file.path;
  try {
    const allowedFields = { bio, gender, profilePicture };
    const [affectedRaws, [updatedData]] = await db.users.update(allowedFields, {
      where: {
        id: req.user.id,
      },
      returning: true,
    });

    if (affectedRaws === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect user ID" });
    }

    const sanitizedUpdatedUserData = updatedData.toJSON();
    delete sanitizedUpdatedUserData.password;
    delete sanitizedUpdatedUserData.deletedAt;

    return res
      .status(200)
      .json({ success: true, data: sanitizedUpdatedUserData });
  } catch (error) {
    console.error("Error while updating a user", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// exports.deleteUsersAsSoft = async (req, res) => {
//   try {
//     const deletedData = await db.users.destroy({
//       where: {
//         deletedAt: {
//           [db.Sequelize.Op.eq]: null,
//         },
//       },
//       truncate: false,
//     });
//     console.log("deletedData: ", deletedData);
//     return res
//       .status(200)
//       .json({ success: true, message: "All users deleted softly." });
//   } catch (error) {
//     console.error("Error while deleting all users softly.", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// };

// exports.restoreSafelyDeletedUser = async (req, res) => {
//   try {
//     const restoreData = await db.users.restore({
//       where: {
//         deletedAt: {
//           [db.Sequelize.Op.ne]: null,
//         },
//       },
//     });
//     return res
//       .status(200)
//       .json({ success: true, message: "Restored All users." });
//   } catch (error) {
//     console.error("Error while restoring all users.", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// };

// exports.deleteUsersAsHard = async (req, res) => {
//   try {
//     const deletedData = await db.users.destroy({ truncate: true, force: true });
//     console.log("deletedData: ", deletedData);
//     return res
//       .status(200)
//       .json({ success: true, message: "All users deleted Hardly." });
//   } catch (error) {
//     console.error("Error while deleting all users Hardly", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// };

exports.logIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        messsage: "Email id and Password must be required.",
      });
    }

    const findUser = await db.users.findOne({
      where: {
        email,
      },
    });

    if (!findUser || !(await bcrypt.compareSync(password, findUser.password))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email ID or Password" });
    }

    // const { accessToken, refreshToken } = await generateToken(findUser);

    const accessToken = await generateToken(
      findUser,
      process.env.JWT_ACCESS_SECRET_KEY,
      "15m"
    );
    const refreshToken = await generateToken(
      findUser,
      process.env.JWT_REFRESH_SECRET_KEY,
      "30d"
    );

    return res.status(200).json({
      success: true,
      message: "Log In successfully.",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error while logging user", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.newAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token required." });
    }

    await jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY,
      async (err, decoded) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Refresh token expired or invalid.",
          });
        }

        const findUser = await db.users.findByPk(decoded.id);
        if (!findUser) {
          return res.status(400).json({
            success: false,
            message: "user not found with this refresh token or token invalid.",
          });
        }
        const accessToken = await generateToken(
          findUser,
          process.env.JWT_ACCESS_SECRET_KEY,
          "15m"
        );
        return res.status(200).json({ success: true, accessToken });
      }
    );
  } catch (error) {
    console.error("Error while generating new access token.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.sendEmail = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const findUser = await db.users.findOne({ where: { email } });

    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with this Email id.",
      });
    }

    const otp = generateOtp(4);
    console.log("otp: ", otp);

    await db.otp.create({
      email,
      otp,
    });

    await mailer(email, otp);

    return res
      .status(200)
      .json({ success: true, message: "Otp send to Email successfully." });
  } catch (error) {
    console.error("Error while sending the otp to Email ID.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.verifyOTP = async (req, res) => {
  const { otp } = req.body;
  try {
    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "Otp is required." });
    }

    const findOTP = await db.otp.findOne({ where: { otp } });

    if (!findOTP) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const sanitizedfindOTP = findOTP.toJSON();
    const timeDifference = sanitizedfindOTP.expiresIn - new Date().getTime();
    if (timeDifference > 0) {
      return res.status(200).json({ success: true, message: "OTP is valid." });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "OTP is expired." });
    }
  } catch (error) {
    console.error("Error while verify OTP.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.changePassword = async (req, res) => {
  const { email, newPassword, otp } = req.body;
  try {
    if (!email || !newPassword || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email, New Password and OTP are required for change.",
      });
    }

    const findOTP = await db.otp.findOne({ where: { otp } });

    if (!findOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    const findUser = await db.users.findOne({ where: { email } });

    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with given Email ID.",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    const [affectedRaws] = await db.users.update(
      { password: hashedPassword },
      { where: { email } }
    );

    if (affectedRaws === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to change the password. Please try again later.",
      });
    } else {
      // affectedRaws === 1
      // await db.otp.destroy({
      //   where: {
      //   otp, email
      // }});
      process.nextTick(async () => {
        await db.otp.destroy({
          where: {
            otp,
            email,
          },
        });
        console.log("after destroy");
      });
      console.log("before destroy");
      return res.status(200).json({
        success: true,
        message: "Password changed successfully.",
      });
    }
  } catch (error) {
    console.error("Error while changing the password.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
