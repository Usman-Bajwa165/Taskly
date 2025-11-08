// backend/src/models/User.ts
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name?: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;

  // reset token fields
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  resetPasswordUsed?: boolean;

  // invalidate tokens issued before this
  passwordChangedAt?: Date | null;
}

const userSchema = new Schema<IUser>({
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  // password reset support
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  resetPasswordUsed: { type: Boolean, default: false },

  // optional to invalidate JWTs issued before password reset
  passwordChangedAt: { type: Date, default: null },
}, { timestamps: true });

// Hash password before saving if modified
// use a non-arrow function and 'this: any' to avoid TS complaining about 'this'
userSchema.pre("save", async function (this: any, next: any) {
  try {
    if (!this.isModified || !this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// instance method
userSchema.methods.comparePassword = async function (this: any, candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;
