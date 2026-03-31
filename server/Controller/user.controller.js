import cloudinary from "../config/cloudinary.js";
import { generateToken } from "../jwtservice/jwt.js";
import User from "../model/user.model.js";
import bcrypt from "bcryptjs";

// sign-up a new user 
export const signup = async (req, res) => {
    const {
        fullName,
        email,
        password,
        bio
    } = req.body;

    // 1. Validate input
    try {
        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({
                success: false, message: "Missing Deatils"
            });


        }

        // 2. Check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Save user
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        });


        const token = generateToken(newUser._id)


        // 5. Response
        res.status(201).json({
            success: true,
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                bio: newUser.bio,

            }
        });



    }
    catch (error) {
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });

    }
}


export const login = async (req, res) => {
    try {
        // 1️⃣ Get data from request body
        const { email, password } = req.body;

        // 2️⃣ Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }
        // 3️⃣ Check if user exists
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        // 4️⃣ Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        // 4. Generate token
        const token = generateToken(user._id)

        // 5. Send response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,

                email: user.email,

            },
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });

    }
}


// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user });
}


//Controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, bio, profilePic } = req.body;

    // 1️⃣ Find existing user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Prepare update object (ONLY update what is provided)
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (bio) updateData.bio = bio;

    // 3️⃣ Upload image ONLY if profilePic exists
    if (profilePic) {
      const uploadResult = await cloudinary.uploader.upload(profilePic, {
        folder: "chat-app/profile-pics",
        resource_type: "image",
      });

      updateData.profilePic = uploadResult.secure_url;
    }

    // 4️⃣ Update user in DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    // 5️⃣ Send response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating profile",
    });
  }
};