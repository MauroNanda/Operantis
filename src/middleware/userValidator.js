function validateUser(req, res, next) {
  const { email, password, firstName, lastName, role } = req.body;

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email is required and must be valid.' });
  }

  // Validar password solo en creación
  if (req.method === 'POST') {
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password is required and must be at least 6 characters.' });
    }
  }

  // Validar firstName y lastName
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    return res.status(400).json({ error: 'First name is required and must be a non-empty string.' });
  }
  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    return res.status(400).json({ error: 'Last name is required and must be a non-empty string.' });
  }

  // Validar role
  const validRoles = ['ADMIN', 'MANAGER', 'USER'];
  if (!role || typeof role !== 'string' || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role is required and must be one of: ADMIN, MANAGER, USER.' });
  }

  next();
}

module.exports = { validateUser }; 