const authController = require("../Controller/auth.controller");
var router = require("express").Router();
const { authenticateToken } = require('../Middleware/Authorization/authenticationToken');


// Register a new User
router.post("/signup", authController.signup);

//Login a User
router.post("/login", authController.login);

//google login
router.get("/", authController.google);
router.get("/google/callback", authController.googleOauth);

  

// Protected routes
// router.get('/profile', authenticateToken, authController.userProfile);


module.exports = router;