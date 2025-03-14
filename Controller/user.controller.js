const db = require("../Model/dbConnection");
const User = db.User;

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.userId; 
        
        const user = await User.findOne({
            where: { user_id: userId },
            attributes: ['user_id', 'user_name', 'user_email', 'user_picture', 'user_roles', 'created_at', 'updated_at']
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                user_picture: user.user_picture,
                roles: user.user_roles,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Error fetching user profile", error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { user_name, user_picture } = req.body;

        // Validate input
        if (!user_name && !user_picture) {
            return res.status(400).json({ message: "At least one field (user_name or user_picture) is required for update" });
        }

        const user = await User.findOne({ where: { user_id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update only provided fields
        const updateData = {};
        if (user_name) updateData.user_name = user_name;
        if (user_picture) updateData.user_picture = user_picture;

        await user.update(updateData);

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                user_picture: user.user_picture,
                roles: user.user_roles,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ message: "Error updating user profile", error: error.message });
    }
};

// Delete user profile
exports.deleteProfile = async (req, res) => {
    try {
        const userId = req.userId;
        
        const user = await User.findOne({ where: { user_id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();
        return res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
        console.error("Error deleting user profile:", error);
        return res.status(500).json({ message: "Error deleting user profile", error: error.message });
    }
}; 