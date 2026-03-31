 import cloudinary from "../config/cloudinary.js";
 import mongoose from "mongoose";
import Message from "../Model/message.model.js";
 import User from "../model/user.model.js";
import { io , userSocketMap } from "../server.js";
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Get all users except logged-in user
    const users = await User.find({
      _id: { $ne: userId }
    }).select("-password");

    // 2️⃣ Aggregate unseen messages (FAST & OPTIMIZED)
    const unseenCounts = await Message.aggregate([
      {
        $match: {
          receiverId: userId,
          seen: false
        }
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 }
        }
      }
    ]);

    // 3️⃣ Convert aggregation result to object
    const unseenMessages = {};
    unseenCounts.forEach(item => {
      unseenMessages[item._id] = item.count;
    });
console.log(   users);

    // 4️⃣ Send response
    return res.status(200).json({
      success: true,
      users,
      userId,
      unseenMessages
    });

  } catch (error) {
    console.error("Get sidebar users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load users"
    });
  }
};


// import Message from "../Model/message.model";
// import User from "../model/user.model";


// // get all users except thw logged in user 
// export const getUserForsidebar =  async (req, res )=>{

//     try {
//          const userId= req.user._id;
//          const filteredUsers = await User.find({_id: {$ne: userId} }).select("-password");
//          // count number of messages not seen 
//          const unseenMessages= {};
//          const promise = filteredUsers.map(async(user)=>{
//             const messages =  await Message.find({senderId:user._id, receiverId:userId, seen :false})
//             if(messages.length>0){
//                 unseenMessages[user._id]=messages.length;
//             }
//          })
//          await Promise.all(promise);
//          res.json({suceess:true , users:filteredUsers , unseenMessages})
//     } catch (error) {
        
//     }
// }

// get all messages for selected user 
export const getMessages =  async(req,res)=>{

  try {
    // ✅ Destructure and rename safely
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    // 1️⃣ Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(selectedUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // 2️⃣ Fetch conversation messages
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId }
      ]
    })
      .sort({ createdAt: 1 }) // oldest → newest
      .lean();                // performance optimization

    // 3️⃣ Mark received messages as seen
    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: myId,
        seen: false
      },
      { $set: { seen: true } }
    );

    // 4️⃣ Send response
    return res.status(200).json({
      success: true,
      messages
    });

  } catch (error) {
    console.error("Get messages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load messages"
    });
  }
};


//api to mark message as seen using message id 
export const markMessageAsSeen=  async (req, res)=>{
  try {
    const { id: messageId } = req.params;  // message id from URL
    const myId = req.user._id;               // logged-in user

    // 1️⃣ Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    // 2️⃣ Find the message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // 3️⃣ Security check (only receiver can mark as seen)
    if (message.receiverId.toString() !== myId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this message"
      });
    }

    // 4️⃣ Mark as seen (idempotent)
    if (!message.seen) {
      message.seen = true;
      await message.save();
    }

    // 5️⃣ Response
    return res.status(200).json({
      success: true,
      message: "Message marked as seen"
    });
    
  } catch (error) {
     console.error("Get messages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load messages"
    });
  }
}


export const sendMessage =  async (req, res)=>{
  try {
    // 1️⃣ Authenticated user (sender)
    const senderId = req.user._id;

    // 2️⃣ Receiver ID from params
    const receiverId = req.params.id?.trim();

    // 3️⃣ Message content
    const { text, image } = req.body;

    // 4️⃣ Validation
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver ID"
      });
    }

    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: "Message must contain text or image"
      });
    }
    let imageUrl;
    if(image){
      const uploadResponse=  await cloudinary.uploader.upload(image);
      imageUrl= uploadResponse.secure_url;
    }

    // 5️⃣ Create message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl || null,
      seen: false
    });

    // emit the new messsage to the receiver's socket\
     const receiverSockets = userSocketMap.get(receiverId);
      //  Emit to receiver if online
if (receiverSockets) {
  receiverSockets.forEach((socketId) => {
    io.to(socketId).emit("newMessage", newMessage);
  });
}
const senderSockets = userSocketMap.get(senderId);
if (senderSockets) {
  senderSockets.forEach((socketId) => {
    io.to(socketId).emit("newMessage", newMessage);
  });
}

    // 6️⃣ Response
    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage
    });

  } catch (error) {
    console.error("Get messages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load messages"
    });
  }
}
