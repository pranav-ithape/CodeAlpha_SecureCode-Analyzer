import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'SECURITY_ANALYST' | 'DEVELOPER';
  createdAt: Date;
  updatedAt: Date;
  firstName?: string;
  lastName?: string;
  username?: string;
  displayName?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  profileImage?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['ADMIN', 'SECURITY_ANALYST', 'DEVELOPER'], default: 'DEVELOPER' },
  firstName: { type: String },
  lastName: { type: String },
  username: { type: String },
  displayName: { type: String },
  phone: { type: String },
  jobTitle: { type: String },
  company: { type: String },
  location: { type: String },
  bio: { type: String },
  website: { type: String },
  linkedin: { type: String },
  github: { type: String },
  profileImage: { type: String }
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err: any) {
    throw err;
  }
});

UserSchema.methods.comparePassword = async function(candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
