const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        details: { name: !name, email: !email, password: !password }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists (case-insensitive)
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user with additional error handling
    console.log('Creating new user:', { name, email });
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password
      });
    } catch (createError) {
      console.error('User creation error:', createError);
      
      // Handle duplicate key/index errors during creation
      if (createError.code === 11000 || createError.code === 11001 || 
          createError.message?.includes('duplicate') || 
          createError.message?.includes('E11000')) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
          details: 'Email address is already registered'
        });
      }
      
      // Re-throw other errors to be handled by outer catch
      throw createError;
    }

    if (user) {
      const token = generateToken(user._id);
      console.log('User created successfully:', user._id);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          },
          token
        }
      });
    } else {
      console.log('User creation failed - returned null');
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
        details: 'User creation returned null or undefined.'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Handle duplicate key error (MongoDB E11000) - covers both duplicate key and duplicate index
    if (error.code === 11000 || error.code === 11001) {
      // Extract the field that caused the duplicate error
      let duplicateField = 'email';
      if (error.keyPattern) {
        duplicateField = Object.keys(error.keyPattern)[0];
      } else if (error.message && error.message.includes('email')) {
        duplicateField = 'email';
      }
      
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
        details: 'Email address is already registered',
        field: duplicateField
      });
    }
    
    // Handle duplicate index errors specifically
    if (error.message && error.message.includes('duplicate key') || error.message.includes('duplicate index')) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
        details: 'Email address is already registered'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: errors.join(', ')
      });
    }
    
    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      body: req.body
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body.email);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful for user:', user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
