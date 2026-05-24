import mongoose from 'mongoose';

const communicationLogSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Please associate a lead with this communication']
    },
    type: {
      type: String,
      enum: ['Call', 'Email', 'Meeting', 'Note'],
      required: [true, 'Please specify the communication type']
    },
    summary: {
      type: String,
      required: [true, 'Please add a summary or description of the interaction'],
      trim: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    followUpDate: {
      type: Date
    },
    followUpCompleted: {
      type: Boolean,
      default: false
    },
    followUpCompletedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const CommunicationLog = mongoose.model('CommunicationLog', communicationLogSchema);
export default CommunicationLog;
