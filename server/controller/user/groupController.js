const mongoose = require("mongoose");
const Group = require("../../model/GroupFriends");
const User = require("../../model/User");

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
exports.createGropup = async (req, res) => {
  try {
    const { name, description, memberIds = [], isPublic } = req.body;
    const creatorId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Ensure memberIds are valid and include creator

    const uniqueMemberIds = [...new Set([...memberIds, creatorId])];
    const validMemberIds = uniqueMemberIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    // Verify all members exists and are friends with creato (if group is private)

    const members = await User.find({
      _id: {
        $in: validMemberIds,
      },
      ...(isPublic ? {} : { contacts: { $elemMatch: { user: creatorId } } }),
    }).select("_id");

    if (members.length !== validMemberIds.length) {
      return res.status(400).json({
        success: false,
        message: "Not all members are valid or not friends with creator",
      });
    }

    const newGroup = await Group.create({
      name,
      description,
      creator: creatorId,
      members: validMemberIds.map((id) => ({
        user: id,
        role: id === creatorId ? "admin" : "member",
      })),
      isPublic,
      admins: [creatorId],
    });

    await newGroup.populate("members.user", "name avatar");
    await newGroup.populate("creator", "name avatar");

    const io = req.app.get("io"); // Get Socket.IO instance
    validMemberIds.forEach((memberId) => {
      if (memberId !== creatorId) {
        io.to(memberId.toString()).emit("group-created", newGroup);
      }
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating group",
    });
  }
};


// @desc    Get all groups for a user
// @route   GET /api/groups
// @access  Private
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await Group.find({
      "members.user": userId,
    })
      .populate("creator", "name avatar")
      .populate("members.user", "name avatar")
      .populate("lastMessage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching groups",
    });
  }
};


// @desc    Get details of a group
// @route   GET /api/groups/:groupId
// @access  Private
exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
    })
      .populate("creator", "name avatar")
      .populate("members.user", "name avatar")
      .populate("lastMessage");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.json({
      success: true,
      group,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching group details",
    });
  }
};


// @desc    Update a group
// @route   PUT /api/groups/:groupId
// @access  Private
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { name, description, avatar } = req.body;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (name) group.name = name;
    if (description) group.description = description;
    if (avatar) group.avatar = avatar;

    await group.save();

    const io = req.app.get("io"); // Get Socket.IO instance
    group.members.forEach((member) => {
      if (member.user.toString() !== userId) {
        io.to(member.user.toString()).emit("group-updated", group);
      }
    });

    res.json({
      success: true,
      message: "Group updated successfully",
      group,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating group",
    });
  }
};


// @desc    Add members to a group
// @route   PUT /api/groups/:groupId/members
// @access  Private
exports.addGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid member ids",
      });
    }

    const group = await Group.findOne({
      _id: groupId,
      admins: userId,
    }).populate("members.user", "_id");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Not authorized to add members to this group",
      });
    }

    const existingMemberIds = group.members.map((m) => m.user._id.toString());
    const newMemberIds = memberIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .filter((id) => !existingMemberIds.includes(id.toString()));

    if (newMemberIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "No valid new members to add",
      });
    }

    // Verify users exist and are friends (for private groups)
    const users = await User.find({
      _id: { $in: newMemberIds },
    });

    if (users.length !== newMemberIds.length) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Some of the new members do not exist or are not friends",
      });
    }

    const newMembers = newMemberIds.map((id) => ({
      user: id,
      role: "member",
    }));

    group.members.push(...newMembers);
    await group.save();

    await group.populate("members.user", "name avatar");

    const io = req.app.get("io");
    newMemberIds.forEach((memberId) => {
      io.to(memberId.toString()).emit("group-updated", group);
    });

    group.members.forEach((member) => {
      if (!newMemberIds.includes(member.user._id.toString())) {
        io.to(member.user._id.toString()).emit("groupMembersAdded", {
          groupId: group._id,
          newMembers: newMembers.map((m) => m.user),
        });
      }
    });

    res.json({
      success: true,
      message: "Members added to group successfully",
      group,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding members to group",
    });
  }
};


// @desc    Remove a member from a group
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private
exports.removeGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: groupId,
      $or: [{ admins: userId }, { "members.user": userId, _id: memberId }],
    }).populate("members.user", "_id name avatar");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Not authorized to remove members from this group",
      });
    }

    if (!group.members.find((m) => m.user._id.toString() === memberId)) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this group",
      });
    }

    if (group.admins.includes(memberId)) {
      const adminCount = group.admins.filter(
        (a) => a.toString() !== userId
      ).length;
      if (adminCount === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove last admin from group",
        });
      }
    }

    // Remove member
    const initialMemberCount = group.members.length;
    group.members = group.members.filter(
      (m) => m.user._id.toString() !== memberId
    );

    if (group.admins.includes(memberId)) {
      group.admins = group.admins.filter((a) => a.toString() !== memberId);
    }
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);

      const io = req.app.get("io");
      io.to(memberId).emit("removedFromGroup", { groupId });
      return res.status(200).json({
        success: true,
        message: "Group deleted successfully",
      });
    }

    await group.save();

    const io = req.app.get("io");
    io.to(memberId).emit("removedFromGroup", { groupId });

    group.members.forEach((member) => {
      io.to(member.user._id.toString()).emit("groupMemberRemoved", {
        groupId: group._id,
        removedMember: memberId,
      });
    });

    res.json({
      success: true,
      message: "Member removed from group successfully",
      group,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing member from group",
    });
  }
};


// @desc    Promote a member to admin in a group
// @route   PUT /api/groups/:groupId/promote/:memberId
// @access  Private
exports.promoteToAdmin = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: groupId,
      admins: userId,
      "members.user": memberId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Not authorized to promote member to admin",
      });
    }

    if (group.admins.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Member is already an admin",
      });
    }

    group.admins.push(memberId);

    const member = group.members.find(
      (m) => m.user._id.toString() === memberId
    );

    if (member) {
      member.role = "admin";
    }

    const io = req.app.get("io");
    group.members.forEach((member) => {
      io.to(member.user.toString()).emit("groupMemberPromoted", {
        groupId: group._id,
        memberId,
      });
    });

    res.status(200).json({
      success: true,
      message: "Member promoted to admin successfully",
      group,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while promoting member to admin",
    });
  }
};


// @desc    Demote an admin in a group
// @route   PUT /api/groups/:groupId/demote/:memberId
// @access  Private
exports.demoteAdmin = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    if (memberId === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot demote yourself",
      });
    }

    const group = await Group.findOne({
      _id: groupId,
      admins: userId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Not authorized to demote admin",
      });
    }

    if (!group.admins.includes(memberId)) {
      return res.status(404).json({
        success: false,
        message: "Member is not an admin",
      });
    }

    group.admins = group.admins.filter((a) => a.toString() !== memberId);

    const member = group.members.find(
      (m) => m.user._id.toString() === memberId
    );

    if (member) member.role = "member";

    await group.save();

    const io = req.app.get("io");
    group.members.forEach((member) => {
      io.to(member.user.toString()).emit("groupMemberDemoted", {
        groupId: group._id,
        memberId,
      });
    });

    res.status(200).json({
      success: true,
      message: "Admin demoted successfully",
      group,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while demoting admin",
    });
  }
};
