const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [10, 'Password must be at least 10 characters'],
      select: false // Don't return password by default
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false
    },
    avatar: {
      type: String,
      default: null
    },
    weightKg: {
      type: Number,
      default: null,
      min: 25,
      max: 250
    },
    location: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      },
      city: {
        type: String,
        default: null
      },
      district: {
        type: String,
        default: null
      },
      state: {
        type: String,
        default: null
      },
      country: {
        type: String,
        default: null
      },
      point: {
        type: {
          type: String,
          enum: ['Point'],
          default: undefined
        },
        coordinates: {
          type: [Number],
          default: undefined
        }
      }
    },
    totalDistance: {
      type: Number,
      default: 0,
      min: 0
    },
    streak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastRunDate: {
      type: Date,
      default: null
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  { timestamps: true }
);

// Additional indexes for leaderboard and location queries
UserSchema.index({ 'location.point': '2dsphere' });
UserSchema.index({ 'location.city': 1 });
UserSchema.index({ 'location.district': 1 });
UserSchema.index({ 'location.state': 1 });
UserSchema.index({ 'location.country': 1 });

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Remove password from JSON response
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
