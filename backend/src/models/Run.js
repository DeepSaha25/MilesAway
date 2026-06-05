const mongoose = require('mongoose');
const RUN_POLICY = require('../config/runPolicy');

const RunSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    clientRunId: {
      type: String,
      required: [true, 'Client run ID is required'],
      trim: true
    },
    distance: {
      type: Number,
      required: [true, 'Distance is required'],
      min: [0, 'Distance cannot be negative']
    },
    duration: {
      type: Number,
      required: [true, 'Duration (in seconds) is required'],
      min: [0, 'Duration cannot be negative']
    },
    coordinates: [
      {
        latitude: {
          type: Number,
          required: true
        },
        longitude: {
          type: Number,
          required: true
        },
        altitude: {
          type: Number,
          default: null
        },
        accuracy: {
          type: Number,
          default: null
        },
        speed: {
          type: Number,
          default: null
        },
        heading: {
          type: Number,
          default: null
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    route: [
      {
        latitude: {
          type: Number,
          required: true
        },
        longitude: {
          type: Number,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    date: {
      type: Date,
      required: [true, 'Run date is required'],
      default: Date.now
    },
    avgSpeed: {
      type: Number,
      default: 0
    },
    averagePace: {
      type: Number,
      default: 0
    },
    caloriesBurned: {
      type: Number,
      default: 0
    },
    elevationGain: {
      type: Number,
      default: 0
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
          default: 'Point'
        },
        coordinates: {
          type: [Number],
          default: undefined
        }
      }
    }
  },
  { timestamps: true }
);

// Derive pace fields from trusted service-calculated metrics.
RunSchema.pre('save', function () {
  if (this.duration && this.duration > 0) {
    const speedKmh = (this.distance / (this.duration / 3600));
    this.avgSpeed = Math.round(speedKmh * 100) / 100;
    this.averagePace = this.distance > 0
      ? Math.round(((this.duration / 60) / this.distance) * 100) / 100
      : 0;
  }
});

// Validate coordinates array
RunSchema.pre('save', function () {
  if (!this.coordinates || this.coordinates.length === 0) {
    throw new Error('Coordinates array cannot be empty');
  }
});

// Index for faster queries
RunSchema.index({ userId: 1, date: -1 });
RunSchema.index(
  { userId: 1, clientRunId: 1 },
  { unique: true, partialFilterExpression: { clientRunId: { $type: 'string' } } }
);
RunSchema.index({ date: -1 });
RunSchema.index({ createdAt: -1 });
RunSchema.index({ 'location.point': '2dsphere' });
RunSchema.index({ 'location.city': 1, date: -1 });
RunSchema.index({ 'location.district': 1, date: -1 });
RunSchema.index({ 'location.state': 1, date: -1 });
RunSchema.index({ 'location.country': 1, date: -1 });

// Method to validate run data
RunSchema.statics.validateRunData = function (distance, duration) {
  const errors = [];

  if (distance < RUN_POLICY.MIN_SAVE_DISTANCE_KM) {
    errors.push(`Distance must be at least ${RUN_POLICY.MIN_SAVE_DISTANCE_KM} km`);
  }

  if (duration <= 0) {
    errors.push('Duration must be greater than 0');
  }

  if (duration < RUN_POLICY.MIN_SAVE_DURATION_SECONDS) {
    errors.push(`Run duration must be at least ${RUN_POLICY.MIN_SAVE_DURATION_SECONDS} seconds`);
  }

  return errors;
};

module.exports = mongoose.model('Run', RunSchema);
