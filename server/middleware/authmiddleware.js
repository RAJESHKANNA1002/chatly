const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    
    req.userEmail = decoded.email || "nothing@gmail.com";
    req.userId = decoded.userId;
    req.userChatId = decoded.telegramId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};