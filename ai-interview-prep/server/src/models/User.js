import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resumeText: { type: String, default: '' },
    resumeName: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
