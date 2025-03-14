const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(403).json({ message: "No token provided!" });
    }
    jwt.verify(token, 'codex', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized! Invalid token." });
      }
      req.userId = decoded.userId;  // Set userId in the request
      next();  // Proceed to the next middleware or route handler
    });
  };
  
  