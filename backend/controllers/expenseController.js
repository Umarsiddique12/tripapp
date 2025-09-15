const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

// @desc    Add expense to trip
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { tripId, description, amount, currency, splitType, participants, category, receipt } = req.body;

    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    // Validate participants
    if (!participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one participant is required'
      });
    }

    // Validate that all participants are trip members
    for (const participant of participants) {
      const isParticipantMember = trip.members.some(member => member.toString() === participant.user.toString());
      if (!isParticipantMember) {
        return res.status(400).json({
          success: false,
          message: 'All participants must be trip members'
        });
      }
    }

    const expense = await Expense.create({
      tripId,
      addedBy: req.user._id,
      description,
      amount,
      currency: currency || 'USD',
      splitType: splitType || 'equal',
      participants,
      category: category || 'other',
      receipt
    });

    await expense.populate('addedBy', 'name email avatar');
    await expense.populate('participants.user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding expense'
    });
  }
};

// @desc    Get expenses for a trip
// @route   GET /api/expenses/trip/:tripId
// @access  Private
const getExpensesByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { page = 1, limit = 20, category } = req.query;

    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    // Build query
    const query = { tripId, isActive: true };
    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query)
      .populate('addedBy', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses'
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('addedBy', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Verify user is a member of the trip
    const trip = await Trip.findById(expense.tripId);
    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense'
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { description, amount, currency, splitType, participants, category, receipt } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only the person who added the expense can update it
    if (expense.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update expenses you added'
      });
    }

    // Update fields
    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (currency) expense.currency = currency;
    if (splitType) expense.splitType = splitType;
    if (participants) expense.participants = participants;
    if (category) expense.category = category;
    if (receipt !== undefined) expense.receipt = receipt;

    await expense.save();
    await expense.populate('addedBy', 'name email avatar');
    await expense.populate('participants.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense'
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only the person who added the expense can delete it
    if (expense.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete expenses you added'
      });
    }

    expense.isActive = false;
    await expense.save();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense'
    });
  }
};

// @desc    Get expense summary for trip
// @route   GET /api/expenses/trip/:tripId/summary
// @access  Private
const getExpenseSummary = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    const expenses = await Expense.find({ tripId, isActive: true })
      .populate('participants.user', 'name email avatar');

    // Calculate balances
    const balances = {};
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Initialize balances for all trip members
    trip.members.forEach(member => {
      balances[member.toString()] = { paid: 0, owes: 0, net: 0 };
    });

    // Calculate what each person paid and owes
    expenses.forEach(expense => {
      const paidBy = expense.addedBy.toString();
      balances[paidBy].paid += expense.amount;

      expense.participants.forEach(participant => {
        const participantId = participant.user._id.toString();
        balances[participantId].owes += participant.amount;
      });
    });

    // Calculate net balance
    Object.keys(balances).forEach(userId => {
      balances[userId].net = balances[userId].paid - balances[userId].owes;
    });

    // Get user details for balances
    const userIds = Object.keys(balances);
    const users = await User.find({ _id: { $in: userIds } }).select('name email avatar');

    const summary = users.map(user => ({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      paid: balances[user._id.toString()].paid,
      owes: balances[user._id.toString()].owes,
      net: balances[user._id.toString()].net
    }));

    res.json({
      success: true,
      data: {
        summary,
        totalExpenses,
        currency: expenses[0]?.currency || 'USD'
      }
    });
  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense summary'
    });
  }
};

module.exports = {
  addExpense,
  getExpensesByTrip,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};
