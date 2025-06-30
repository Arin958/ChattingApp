const mongoose = require("mongoose");
require("dotenv").config(
    { path: "../.env" }
); // If you're using environment variables

const Message = require("../model/Message"); // Adjust the path

const MONGO_URI = process.env.MONGODB_URI

const deleteAllMessages = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await Message.deleteMany({});
    console.log(`${result.deletedCount} messages deleted.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error deleting messages:", err);
  }
};

deleteAllMessages();
