const db = require("../Model/dbConnection");
const User = db.User;
const bcrypt = require('bcrypt');
const axios = require('axios');
require('dotenv').config();
const jwt = require('jsonwebtoken');



// Custom Sign-up logic for user registration
exports.signup = async (req, res) => {
  const { user_name, user_email, password, roles } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { user_email } });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user with custom registration details
    const newUser = await User.create({
      user_name,
      user_email,
      password: hashedPassword,  // Store hashed password
      user_roles: roles || ["User"]  // Default to "User" role if not provided
    });
    return res.status(201).json({
      message: "User successfully registered",
      user: {
        user_id: newUser.user_id,
        user_name: newUser.user_name,
        user_email: newUser.user_email,
        roles: newUser.user_roles
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Error registering user", error: err });
  }
};


// Login a user
exports.login = async (req, res) => {
  try {
    const { user_email, password } = req.body;

    // Validate input
    if (!user_email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ where: { user_email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    let token;
    try {
      token = jwt.sign({ userId: user.user_id, roles: user.user_roles }, 'codex', { expiresIn: '1h' });
    } catch (tokenError) {
      console.error("JWT Error: ", tokenError);
      return res.status(500).json({ message: "Token generation failed" });
    }

    // Return token and user info (excluding password)
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_email: user.user_email,
        user_roles: user.user_roles
      }
    });

  } catch (err) {
    console.error("Login error: ", err);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
};



// Google OAuth Login - Step 1: Redirect to Google OAuth
exports.google = (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_OAUTH_REDIRECT_URL}&scope=email%20profile`;
  console.log(googleAuthUrl);
  res.redirect(googleAuthUrl);
};


// Google OAuth Callback - Step 2: Handle OAuth callback from Google
exports.googleOauth = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided!' });
    }

    console.log("Received authorization code from Google:", code);

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
      grant_type: 'authorization_code',
    });

    if (!tokenResponse.data.access_token) {
      return res.status(500).json({ error: 'Failed to obtain access token from Google' });
    }

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.data) {
      return res.status(500).json({ error: 'Failed to retrieve user info from Google' });
    }

    const { id: googleId, name: displayName, email, picture } = userResponse.data;

    console.log("Google user info:", userResponse.data);

    // Check if user already exists
    
    let user = await User.findOne({ where: { oauth_provider_id: googleId, oauth_provider: 'google' } });

    if (!user) {
      user = await User.create({
        user_name: displayName,
        user_email: email,
        oauth_provider: 'google',
        oauth_provider_id: googleId,
        user_picture: picture,
        user_roles: ['user'], // 👈👈 Default role as array
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET || 'codex', { expiresIn: '1h' });

    let currentUser = await User.findOne({ where: { user_email : email } });


    // user_role is array here
    console.log("User role array:", JSON.stringify(currentUser.user_roles)); 

    // user.user_role is now an array
    const encodedToken = encodeURIComponent(token);

// 🔥 Correct this line:
const encodedRole = encodeURIComponent(JSON.stringify(currentUser.user_roles));

console.log("role", encodedRole, "decoded role", decodeURIComponent(encodedRole));


    const redirectUrl = `http://localhost:5173/google-callback?token=${encodedToken}&role=${encodedRole}`;

    return res.redirect(redirectUrl);

  } catch (err) {
    console.error("Google OAuth Error:", err);

    if (err.response) {
      return res.status(err.response.status).json({ error: err.response.data.error });
    }

    return res.status(500).json({ error: 'Google Authentication failed', details: err.message });
  }
};


// Optionally, you can implement logout and get current user functionalities based on your app’s logic.
//may add later 



// Profile Endpoint
exports.userProfile = async (req, res) => {
  try {
    // Get the user ID from the request (set by verifyToken middleware)
    const userId = req.userId;

    // Fetch the user details by user ID, excluding the password field
    const user = await User.findOne({
      where: { user_id: userId },
      attributes: { exclude: ['password'] }  // Do not return the password
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    // Send back the user profile information
    return res.status(200).json({
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_email: user.user_email,
        user_picture : user.user_picture ,
        roles: user.user_roles,
        createdAt: user.createdAt,  
        updatedAt: user.updatedAt,
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching user profile", error: err });
  }
};
