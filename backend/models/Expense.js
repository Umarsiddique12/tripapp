const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    maxlength: 3
  },
  splitType: {
    type: String,
    enum: ['equal', 'custom', 'paid_by_one'],
    default: 'equal'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paid: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    enum: ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'],
    default: 'other'
  },
  receipt: {
    type: String, // URL to receipt image
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for total participants
expenseSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for amount per person (for equal split)
expenseSchema.virtual('amountPerPerson').get(function() {
  if (this.splitType === 'equal' && this.participants.length > 0) {
    return this.amount / this.participants.length;
  }
  return 0;
});

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);
