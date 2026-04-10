const protect = async (req, res, next) => {
  try {
    // Replace this with your real JWT/session auth
    // Example: req.user = decoded token user
    // TEMP DEMO:
    req.user = {
      id: req.headers['x-user-id'], // send from frontend for testing
    };

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. User ID missing.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized.',
    });
  }
};

module.exports = {
  protect,
};
