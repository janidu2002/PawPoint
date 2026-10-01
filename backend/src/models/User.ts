import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/**
 * A registered PawPoint account.
 *
 * `password` stores a bcrypt hash and is `select: false`, so it is excluded
 * from queries unless explicitly requested with `.select("+password")`. That
 * makes it impossible to leak the hash by forgetting a projection.
 */
export interface IUser {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      // Normalised on save so "A@B.com" and "a@b.com" cannot both register.
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);

export default User;
