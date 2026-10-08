import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  topic: { type: String, default: 'General' },
  isFollowUp: { type: Boolean, default: false },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  answer: { type: String, default: '' },
  score: { type: Number, min: 0, max: 10, default: null },
  feedback: { type: String, default: '' },
  strengths: [String],
  improvements: [String],
  idealHint: { type: String, default: '' },
  answeredAt: Date,
});

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true, trim: true, maxlength: 80 },
    level: { type: String, default: 'Fresher' },
    focus: { type: String, default: 'Mixed' },
    usesResume: { type: Boolean, default: false },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    questions: [questionSchema],
    overallScore: { type: Number, default: null }, // 0-100
    summary: { type: String, default: '' },
    strengths: [String],
    weakAreas: [String],
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Interview', interviewSchema);
