const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define("User", {
        user_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        user_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        user_email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        user_picture: {
            type: Sequelize.STRING, // Store profile picture URL
            allowNull: true,
        },
        password: {
            type: Sequelize.STRING,
            allowNull: true, // Make password optional for OAuth users
        },
        user_roles: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: false,
            defaultValue: ["User"],
        },
        oauth_provider: {
            type: Sequelize.STRING, // e.g., 'google', 'facebook', 'github'
            allowNull: true,
        },
        oauth_provider_id: {
            type: Sequelize.STRING, // e.g., the user's Google ID
            allowNull: true,
            unique: true,
        },
        oauth_access_token: {
            type: Sequelize.STRING, // Store the OAuth access token (optional)
            allowNull: true,
        },
    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    return User;
};
