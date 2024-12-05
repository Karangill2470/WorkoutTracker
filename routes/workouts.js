var express = require('express');
var router = express.Router();
var Workout = require('../models/Workout');
const FuzzySearch = require('fuzzy-search');

router.get('/search', async (req, res) => {
    const { query } = req.query;

    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }

    try {
        const userId = req.user._id;
        let workouts = [];

        if (query) {
            workouts = await Workout.find({ user: userId }).exec();
            const searcher = new FuzzySearch(workouts, ['exerciseName', 'category'], {
                caseSensitive: false,
                sort: true
            });
            workouts = searcher.search(query);
        } else {
            workouts = await Workout.find({ user: userId }).sort({ date: -1 });
        }

        const formattedWorkouts = workouts.map(workout => {
            return {
                _id: workout._id.toString(),
                exerciseName: workout.exerciseName,
                duration: workout.duration,
                caloriesBurned: workout.caloriesBurned,
                category: workout.category,
                date: workout.date.toLocaleDateString('en-US'),
            };
        });

        res.render('workouts/view', {
            title: 'Your Workouts',
            user: req.user.username,
            workouts: formattedWorkouts,
            query,
        });
    } catch (err) {
        console.log(err);
        res.status(500).render('index', {
            title: 'Your Workouts',
            user: req.user.username,
            error: 'Could not load your workouts. Please try again later.',
        });
    }
});

// GET /WORKOUTS/VIEW - VIEW WORKOUTS
router.get('/view', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }

    try {
        const userId = req.user._id;
        const workouts = await Workout.find({ user: userId }).sort({ date: -1 });

        const formattedWorkouts = workouts.map(workout => {
            return {
                _id: workout._id.toString(),
                exerciseName: workout.exerciseName,
                duration: workout.duration,
                caloriesBurned: workout.caloriesBurned,
                date: workout.date.toLocaleDateString('en-US'),
            };
        });

        res.render('workouts/view', {
            title: 'Your Workouts',
            user: req.user.username,
            workouts: formattedWorkouts,
        });
    } catch (err) {
        console.log(err);
        res.status(500).render('index', {
            title: 'Your Workouts',
            user: req.user.username,
            error: 'Could not load your workouts. Please try again later.',
        });
    }
});

// GET ROUTE TO DISPLAY THE "ADD WORKOUT" FORM
router.get('/add', (req, res) => {
    if (!req.user) {
        return res.redirect('/users/login');
    }
    res.render('workouts/add', { title: 'Add Workout' });
});

// POST ROUTE TO HANDLE THE SUBMISSION OF THE "ADD WORKOUT" FORM
router.post('/add', async (req, res) => {
    const { exerciseName, duration, caloriesBurned } = req.body;

    if (!exerciseName || !duration || !caloriesBurned) {
        return res.render('workouts/add', {
            title: 'Add Workout',
            error: 'All fields are required!'
        });
    }

    try {
        const newWorkout = new Workout({
            exerciseName,
            duration,
            caloriesBurned,
            user: req.user._id
        });

        await newWorkout.save();
        res.redirect('/workouts/view');
    } catch (err) {
        console.error(err);
        res.render('workouts/add', { title: 'Add Workout', error: 'Error saving workout!' });
    }
});

// GET /WORKOUTS/:ID/EDIT - EDIT WORKOUT
router.get('/:id/edit', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }

    try {
        const workout = await Workout.findById(req.params.id);

        if (!workout) {
            return res.status(404).render('index', {
                title: 'Edit Workout',
                user: req.user.username,
                error: 'Workout not found.',
            });
        }

        if (workout.user.toString() !== req.user._id.toString()) {
            return res.status(403).render('index', {
                title: 'Edit Workout',
                user: req.user.username,
                error: 'You are not authorized to edit this workout.',
            });
        }

        const workoutObject = workout.toObject();
        res.render('workouts/edit', {
            title: 'Edit Workout',
            workout: workoutObject,
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index', {
            title: 'Edit Workout',
            user: req.user.username,
            error: 'Error fetching workout data.',
        });
    }
});

// POST /WORKOUTS/:ID/EDIT - UPDATE WORKOUT
router.post('/:id/edit', async (req, res) => {
    const { exerciseName, duration, caloriesBurned } = req.body;

    if (!exerciseName || !duration || !caloriesBurned) {
        return res.render('workouts/edit', {
            title: 'Edit Workout',
            error: 'All fields are required!',
            workout: req.body,
        });
    }

    try {
        const workout = await Workout.findById(req.params.id);

        if (!workout) {
            return res.status(404).render('index', {
                title: 'Edit Workout',
                user: req.user.username,
                error: 'Workout not found.',
            });
        }

        if (workout.user.toString() !== req.user._id.toString()) {
            return res.status(403).render('index', {
                title: 'Edit Workout',
                user: req.user.username,
                error: 'You are not authorized to edit this workout.',
            });
        }

        workout.exerciseName = exerciseName;
        workout.duration = duration;
        workout.caloriesBurned = caloriesBurned;

        await workout.save();
        res.redirect('/workouts/view');
    } catch (err) {
        console.error(err);
        res.status(500).render('index', {
            title: 'Edit Workout',
            user: req.user.username,
            error: 'Error updating workout!',
        });
    }
});

// POST /WORKOUTS/:ID/DELETE - DELETE WORKOUT
router.post('/:id/delete', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }

    try {
        const workout = await Workout.findById(req.params.id);

        if (!workout) {
            return res.status(404).render('index', {
                title: 'Delete Workout',
                user: req.user.username,
                error: 'Workout not found.',
            });
        }

        if (workout.user.toString() !== req.user._id.toString()) {
            return res.status(403).render('index', {
                title: 'Delete Workout',
                user: req.user.username,
                error: 'You are not authorized to delete this workout.',
            });
        }

        await Workout.findByIdAndDelete(req.params.id);
        res.redirect('/workouts/view');
    } catch (err) {
        console.error(err);
        res.status(500).render('index', {
            title: 'Delete Workout',
            user: req.user.username,
            error: 'Error deleting workout!',
        });
    }
});

// Export the router
module.exports = router;
