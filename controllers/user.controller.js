const bcrypt = require("bcryptjs");
const db = require("../models");
const {
  generateToken,
  generateOtp,
  mailer,
  hashPassword,
} = require("../utils/utilityFunctions.js");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

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

exports.getAllPostByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User id is required." });
    }
    const allPostOfUsers = await db.posts.findAll({
      where: { userId },
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
    if (!allPostOfUsers.length) {
      return res
        .status(404)
        .json({ success: false, message: "User don't upload post yet." });
    }
    return res.status(200).json({
      success: true,
      message: "All posts of user fetched successfully.",
      data: allPostOfUsers,
    });
  } catch (error) {
    console.log("Error while fetching users's all the posts", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const loggedInUserId = req.user.id;
  try {
    if (+userId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You are unauthorized to delete other user.",
      });
    }

    const deletedDataLength = await db.users.destroy({
      where: {
        id: userId,
      },
    });

    if (deletedDataLength === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect user ID" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User deleted Successfullly." });
  } catch (error) {
    console.error("Error while deleting a user", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.restoreUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email id and password are required.",
      });
    }

    const findUser = await db.users.findOne({
      where: {
        email,
      },
      paranoid: false,
    });

    if (!findUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userNotAlreadyDeleted = await db.users.findOne({
      where: {
        email,
        deletedAt: {
          [Op.eq]: null,
        },
      },
    });

    if (userNotAlreadyDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not delete this account already.",
      });
    }

    const passwordValid = await bcrypt.compareSync(password, findUser.password);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect.",
      });
    }

    const timeTillExpire =
      findUser.deletedAt.getTime() + 7 * 24 * 60 * 60 * 1000;

    if (timeTillExpire - new Date().getTime() < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Account restore validity expired. Feel free to create new account.",
      });
    }
    const restoredAccount = await db.users.restore({ where: { email } });
    if (restoredAccount) {
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
        message: "account restored successfully",
        accessToken,
        refreshToken,
      });
    }
  } catch (error) {
    console.error("Error while restoring a user", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

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

exports.addCountry = async (req, res) => {
  try {
    const newCountries = await db.employees.bulkCreate([
      { employeeName: "bhavin", cityId: 3, gender: "male", age: 23, email: "bhavin@gmail.com"  },
      { employeeName: "dax", cityId: 2, gender: "male", age: 25, email: "dax@gmail.com"  },
      { employeeName: "het", cityId: 4, gender: "male", age: 56, email: "het@gmail.com"  },
      { employeeName: "raj", cityId: 1, gender: "male", age: 23, email: "raj@gmail.com"  },
      { employeeName: "surya", cityId: 5, gender: "male", age: 88, email: "surya@gmail.com"  },
      { employeeName: "ved", cityId: 3, gender: "male", age: 99, email: "ved@gmail.com"  },
      { employeeName: "jainam", cityId: 6, gender: "male", age: 56, email: "jainam@gmail.com"  },
      { employeeName: "vd", cityId: 8, gender: "male", age: 78, email: "vd@gmail.com"  },
      { employeeName: "nirmal", cityId: 9, gender: "male", age: 71, email: "nirmal@gmail.com"  },
      { employeeName: "harshil", cityId: 10, gender: "male", age: 81, email: "harshil@gmail.com"  },
      { employeeName: "smit", cityId: 9, gender: "male", age: 53, email: "smit@gmail.com"  },
      { employeeName: "meet", cityId: 8, gender: "male", age: 69, email: "meet@gmail.com"  },
      { employeeName: "ravi", cityId: 5, gender: "male", age: 41, email: "ravi@gmail.com"  },
      { employeeName: "hemang", cityId: 5, gender: "male", age: 50, email: "hemang@gmail.com"  },
      { employeeName: "jemin", cityId: 10, gender: "male", age: 34, email: "jemin@gmail.com"  },
      { employeeName: "pratik", cityId: 5, gender: "male", age: 39, email: "pratik@gmail.com"  },
      { employeeName: "darshan", cityId: 9, gender: "male", age: 27, email: "darshan@gmail.com"  },
      { employeeName: "chirag", cityId: 3, gender: "male", age: 47, email: "chirag@gmail.com"  },
      { employeeName: "jamana", cityId: 5, gender: "female", age: 26, email: "jamana@gmail.com"  },
      { employeeName: "aakash", cityId: 2, gender: "male", age: 18, email: "aakash@gmail.com"  },
      { employeeName: "rahul", cityId: 6, gender: "male", age: 16, email: "rahul@gmail.com"  },
      { employeeName: "priyam", cityId: 2, gender: "male", age: 35, email: "priyam@gmail.com"  },
      { employeeName: "sahil", cityId: 5, gender: "male", age: 17, email: "sahil@gmail.com"  },
      { employeeName: "radha", cityId: 2, gender: "female", age: 35, email: "radha@gmail.com"  },
      { employeeName: "jay", cityId: 1, gender: "male", age: 90, email: "jay@gmail.com"  },
      { employeeName: "sheela", cityId: 6, gender: "female", age: 50, email: "sheela@gmail.com"  },
      { employeeName: "parag", cityId: 2, gender: "male", age: 37, email: "parag@gmail.com"  },
      { employeeName: "jaydeep", cityId: 6, gender: "male", age: 22, email: "jaydeep@gmail.com"  },
      { employeeName: "milan", cityId: 4, gender: "male", age: 28, email: "milan@gmail.com"  },
      { employeeName: "bharat", cityId: 9, gender: "male", age: 48, email: "bharat@gmail.com"  },
      { employeeName: "sita", cityId: 10, gender: "female", age: 54, email: "sita@gmail.com"  },
      { employeeName: "shweta", cityId: 9, gender: "female", age: 57, email: "shweta@gmail.com"  },
      { employeeName: "gita", cityId: 8, gender: "female", age: 69, email: "gita@gmail.com"  },
      { employeeName: "yash", cityId: 8, gender: "male", age: 84, email: "yash@gmail.com"  },
      { employeeName: "kita", cityId: 10, gender: "female", age: 75, email: "kita@gmail.com"  },
      { employeeName: "mita", cityId: 5, gender: "female", age: 38, email: "mita@gmail.com"  },
      { employeeName: "ashok", cityId: 1, gender: "male", age: 22, email: "ashok@gmail.com"  },
      { employeeName: "nita", cityId: 1, gender: "female", age: 21, email: "nita@gmail.com"  },
      { employeeName: "ganga", cityId: 8, gender: "female", age: 48, email: "ganga@gmail.com"  },
      { employeeName: "rita", cityId: 5, gender: "female", age: 75, email: "rita@gmail.com"  },
      { employeeName: "laxmi", cityId: 2, gender: "female", age: 94, email: "laxmi@gmail.com"  },
      { employeeName: "vibha", cityId: 7, gender: "female", age: 53, email: "vibha@gmail.com"  },
      { employeeName: "kishor", cityId: 4, gender: "male", age: 66, email: "kishor@gmail.com"  },
      { employeeName: "raja", cityId: 5, gender: "male", age: 40, email: "raja@gmail.com"  },
      { employeeName: "kamal", cityId: 5, gender: "male", age: 30, email: "kamal@gmail.com"  },
      { employeeName: "rani", cityId: 6, gender: "female", age: 31, email: "rani@gmail.com"  },
      { employeeName: "madhuri", cityId: 8, gender: "female", age: 84, email: "madhuri@gmail.com"  },
      { employeeName: "gopi", cityId: 10, gender: "female", age: 104, email: "gopi@gmail.com"  },
      { employeeName: "shyam", cityId: 6, gender: "male", age: 53, email: "shyam@gmail.com"  },
      { employeeName: "sheetal", cityId: 9, gender: "female", age: 23, email: "sheetal@gmail.com"  },
    ]);
  } catch (error) {
    console.error("Error while adding the countries.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
