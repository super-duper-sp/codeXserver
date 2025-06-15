const db = require("../Model/dbConnection");
const User = db.User;
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { successResponse, errorResponse } = require('../Utils/responseHelper');

// Custom Sign-up logic
exports.signup = async (req, res) => {
  const { user_name, user_email, password, roles } = req.body;
  try {
    const existingUser = await User.findOne({ where: { user_email } });
    if (existingUser) {
      return res.status(400).json(errorResponse("User with this email already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      user_name,
      user_email,
      password: hashedPassword,
      user_roles: roles || ["User"]
    });

    return res.status(201).json(successResponse("User successfully registered", {
      user_id: newUser.user_id,
      user_name: newUser.user_name,
      user_email: newUser.user_email,
      roles: newUser.user_roles
    }));

  } catch (err) {
    return res.status(500).json(errorResponse("Error registering user", err.message));
  }
};


// Login
exports.login = async (req, res) => {
  try {
    const { user_email, password } = req.body;

    if (!user_email || !password) {
      return res.status(400).json(errorResponse("Email and password are required"));
    }

    const user = await User.findOne({ where: { user_email } });
    if (!user) {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }

    const token = jwt.sign({ userId: user.user_id, roles: user.user_roles }, process.env.JWT_SECRET || 'codex', {
      expiresIn: '1h'
    });

    return res.status(200).json(successResponse("Login successful", {
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_email: user.user_email,
        user_roles: user.user_roles
      }
    }));

  } catch (err) {
    return res.status(500).json(errorResponse("Server error, please try again later", err.message));
  }
};


// Google OAuth Step 1: Redirect to Google
exports.google = (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_OAUTH_REDIRECT_URL}&scope=email%20profile`;
  console.log(googleAuthUrl);
  res.redirect(googleAuthUrl);
};


// Google OAuth Callback
exports.googleOauth = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json(errorResponse('Authorization code not provided!'));
    }

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
      grant_type: 'authorization_code',
    });

    if (!tokenResponse.data.access_token) {
      return res.status(500).json(errorResponse('Failed to obtain access token from Google'));
    }

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.data) {
      return res.status(500).json(errorResponse('Failed to retrieve user info from Google'));
    }

    const { id: googleId, name: displayName, email, picture } = userResponse.data;

    let user = await User.findOne({ where: { oauth_provider_id: googleId, oauth_provider: 'google' } });

    if (!user) {
      user = await User.create({
        user_name: displayName,
        user_email: email,
        oauth_provider: 'google',
        oauth_provider_id: googleId,
        user_picture: picture,
        user_roles: ['user']
      });
    }

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET || 'codex', { expiresIn: '1h' });

    const currentUser = await User.findOne({ where: { user_email: email } });

    const encodedToken = encodeURIComponent(token);
    const encodedRole = encodeURIComponent(JSON.stringify(currentUser.user_roles));

    const redirectUrl = `http://localhost:5173/google-callback?token=${encodedToken}&role=${encodedRole}`;
    return res.redirect(redirectUrl);

  } catch (err) {
    console.error("Google OAuth Error:", err);

    if (err.response) {
      return res.status(err.response.status).json(errorResponse(err.response.data.error));
    }

    return res.status(500).json(errorResponse("Google Authentication failed", err.message));
  }
};


// Profile
exports.userProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findOne({
      where: { user_id: userId },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    return res.status(200).json(successResponse("User profile fetched successfully", {
      user_id: user.user_id,
      user_name: user.user_name,
      user_email: user.user_email,
      user_picture: user.user_picture,
      roles: user.user_roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

  } catch (err) {
    return res.status(500).json(errorResponse("Error fetching user profile", err.message));
  }
};