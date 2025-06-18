const validateRegister = (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;

  // Check if all required fields are present
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      error: 'All fields are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long'
    });
  }

  // Validate name fields
  if (firstName.trim().length === 0 || lastName.trim().length === 0) {
    return res.status(400).json({
      error: 'First name and last name cannot be empty'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check if all required fields are present
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin
}; 