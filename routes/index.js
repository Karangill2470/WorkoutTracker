var express = require('express');
var router = express.Router();
var Workout = require('../models/Workout');

// GET ROUTE FOR THE HOMEPAGE DISPLAYING WORKOUTS
router.get('/', async function(req, res, next) {
  try {
    const user = req.user || null;
    const workouts = user ? 
      await Workout.find({ user: user._id }).sort({ date: -1 }) :
      await Workout.find().sort({ date: -1 });

    res.render('index', {
      title: 'Workout Tracker',
      workouts: workouts,
      user: user
    });
  } catch (err) {
    next(err); 
  }
});

module.exports = router;
