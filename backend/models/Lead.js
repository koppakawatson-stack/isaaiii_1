import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Please add a company name'],
      trim: true
    },
    contactPerson: {
      type: String,
      required: [true, 'Please add a contact person'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add a contact email'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    dealAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Follow-up', 'Negotiation', 'Won', 'Lost'],
      default: 'New'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    expectedClosingDate: {
      type: Date
    },
    aiScore: {
      type: Number,
      default: 50
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    notes: {
      type: String,
      default: ''
    },
    leadSource: {
      type: String,
      enum: ['Website', 'Referral', 'Exhibition', 'Cold Call', 'Others'],
      default: 'Website'
    }
  },
  {
    timestamps: true
  }
);

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
