var Express = require('express');
var Tags = require('../../Validator.js').Tags;
var router = Express.Router({mergeParams: true});
var doErrorResponse = require('../../Validator.js').doErrorResponse;
var sequelize = require('../../sequelize.js');
var Promise = require('bluebird');

var attemptRouter = require('./Attempt/attempts.js');
router.use('/:challengeName/attempt', attemptRouter);


// Get all weeks, which contain the challenges
router.get('/', function(req, res) {
  return sequelize.Week.findAll({
    where: {courseSanitizedName: req.params.courseName},
    include: [{
      model: sequelize.Challenge,
      include: [{
        model: sequelize.Attempt,
        where: {personId: req.session.id},
        order: [['createdAt', 'DESC']],
        required: false // otherwise it filters out any challenges we haven't attempted
      }]
    }]
  })
  .then(function(allWeeks) {
    return res.json(allWeeks);
  })
  .catch(doErrorResponse(res));
});

/** Verify that the user passed in good data to the challenge **/
function validateChallengeData(vld, req) {
  return vld.checkAdminOrTeacher()
  .then(function() {
    return vld.hasFields(req.body, ["name", "description", "type", "answer", "weekIndex", "dayIndex"]);
  })
  .then(function() {
    if (req.body["type"] === "multchoice") {
      console.log(req.body);
      return vld.check(req.body["choices"] &&
      Array.isArray(req.body["choices"]) &&
      req.body["choices"].length >= 2, Tags.badValue, {field: "choices"});
    }
    else if (req.body["type"] === "number") {
      return vld.check(!isNaN(parseInt(req.body["answer"])), Tags.badValue, {field: "answer"});
    }
    else if (req.body["type"] === "shortanswer") {
      // short answer just gotta be non-null
    }
    else {
      return Promise.reject({message: 'Invalid type', tags: Tags.badValue});
    }
  });
}

/** Actually make that challenge, everything's good! **/
function makeChallenge(course, req, res) {
  req.body.courseName = req.params.courseName;

  var challengeDate = course.Weeks[0].startDate;
  challengeDate.setDate(challengeDate.getDate()+req.body.dayIndex);
  req.body.openDate = challengeDate;

  var makeChallenge = sequelize.Challenge.create(req.body);
  var promiseList = [makeChallenge];

  if (req.body["type"] === "multchoice") {
    for (var ndx = 0; ndx < req.body["choices"].length; ndx++) {
      var answerText = req.body["choices"][ndx];
      var answer = sequelize.MultChoiceAnswer.create({index: ndx, text: answerText});
      promiseList.push(answer);
    }
  }

  return Promise.all(promiseList)
  .then(function(arr) {
    console.log(JSON.stringify(arr));
    var newChallenge = arr[0];
    var choices = arr.slice(1);

    var addChlToWeek = course.Weeks[0].addChallengesAndSetDate([newChallenge]);
    var addChoicesToChl = newChallenge.addPossibilities(choices);

    return Promise.all([addChlToWeek, addChoicesToChl]);
  })
  .then(function() {
    res.location(router.baseURL + '/' + req.body.name).sendStatus(200).end();
    return Promise.resolve();
  });
}

/** Make new challenge **/
router.post('/', function(req, res) {
  var vld = req.validator;

  validateChallengeData(vld, req)
  .then(function() {
    return sequelize.Course.findOne({
      where: {sanitizedName: req.params.courseName},
      include: [{
        model: sequelize.Week,
        where: {weekIndexInCourse: req.body.weekIndex}
      }]
    });
  })
  .then(function(course) {
    console.log("course guy " + JSON.stringify(course));
    return vld.check(course, Tags.notFound, null, course)
    .then(function(course) {
      return vld.check(course.Weeks[0], Tags.badValue, {field: "weekIndex"}, course);
    })
    .then(function(course) {
      return vld.checkPrsOK(course.ownerId, course);
    })
    .then(function(course) {
      return course.Weeks[0].getChallenges({where: {dayIndex: req.body.dayIndex}});
    })
    .then(function(chls) {
      return vld.check(chls.length === 0, Tags.dupDay, null, course); // verify there's not already a challenge on that day
    });
  })
  .then(function(course) {
    return makeChallenge(course, req, res);
  })
  .catch(doErrorResponse(res));
});

router.get('/:name', function(req, res) {
  var vld = req.validator;

  var excludeAnswer = { exclude: ['answer'] };
  if (req.session.isAdminOrTeacher()) {
    excludeAnswer = {}; // let teachers see the answer
  }

  sequelize.Challenge.findOne({where:
    {sanitizedName: req.params.name},
    include: [
      {
        model: sequelize.MultChoiceAnswer,
        as: "Possibilities"
      },
      {
        model: sequelize.Attempt,
        where: {personId: req.session.id},
        required: false
      }
    ],
    attributes: excludeAnswer
  })
  .then(function(chl) {
    if (chl) {
      res.json(chl);
    }
    else {
      res.sendStatus(404);
    }
  })
  .catch(doErrorResponse(res));
});

module.exports = router;
