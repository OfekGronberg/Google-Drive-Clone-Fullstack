"use strict";

const mongoose = require("mongoose");

const DEFAULT_URI = "mongodb://localhost:27017/advanced_part5";

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI || DEFAULT_URI;
  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });

  isConnected = true;
};

const generateId = () => new mongoose.Types.ObjectId().toString();

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String },
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    name: { type: String },
    imageUrl: { type: String, default: "" },
    theme: { type: String, default: "light" },
    myDriveFolderId: { type: String },
    sharedFolderId: { type: String },
    recentFolderId: { type: String },
    starredFolderId: { type: String },
    trashFolderId: { type: String }
  },
  { timestamps: true, versionKey: false }
);

const FileSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    type: { type: String, required: true },
    ex2Name: { type: String },
    parentId: { type: String, default: null, index: true },
    targetId: { type: String },
    starred: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    ownerId: { type: String },
    isSystem: { type: Boolean, default: false },
    isRoot: { type: Boolean, default: false },
    isSystemFolder: { type: Boolean, default: false },
    originalParentId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    lastChange: { type: Date, default: Date.now },
    lastViewed: { type: Date, default: Date.now }
  },
  { timestamps: true, versionKey: false }
);

const RecentSchema = new mongoose.Schema(
  {
    _id: { type: String },
    fileId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    accessedAt: { type: Date, default: Date.now }
  },
  { timestamps: false, versionKey: false }
);

const PermissionSchema = new mongoose.Schema(
  {
    _id: { type: String },
    fileId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);

const ImageSchema = new mongoose.Schema(
  {
    _id: { type: String },
    data: { type: String, required: true },
    mimeType: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    uploadedAt: { type: String, required: true }
  },
  { timestamps: false, versionKey: false }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const File = mongoose.models.File || mongoose.model("File", FileSchema);
const Recent = mongoose.models.Recent || mongoose.model("Recent", RecentSchema);
const Permission = mongoose.models.Permission || mongoose.model("Permission", PermissionSchema);
const Image = mongoose.models.Image || mongoose.model("Image", ImageSchema);

module.exports = {
  connectToDatabase,
  generateId,
  models: {
    User,
    File,
    Recent,
    Permission,
    Image
  }
};
