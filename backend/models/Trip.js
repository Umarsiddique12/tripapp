const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true,
    maxlength: [100, 'Trip name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  destination: {
    type: String,
    trim: true,
    maxlength: [100, 'Destination cannot be more than 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBudget: {
    type: Number,
    default: 0,
    min: [0, 'Budget cannot be negative']
  }
}, {
  timestamps: true
});

// Add creator to members array when trip is created
tripSchema.pre('save', function(next) {
  if (this.isNew && !this.members.includes(this.createdBy)) {
    this.members.push(this.createdBy);
  }
  next();
});

// Virtual for member count
tripSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for expense count (will be populated)
tripSchema.virtual('expenseCount', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'tripId',
  count: true
});

// Ensure virtual fields are serialized
tripSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);
