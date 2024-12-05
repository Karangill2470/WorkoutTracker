const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WorkoutSchema = new Schema({
    exerciseName: {
        type: String,
        required: true,
        trim: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    caloriesBurned: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

WorkoutSchema.methods.getUser = async function () {
    return await User.findById(this.user);
};

module.exports = mongoose.model('Workout', WorkoutSchema);
