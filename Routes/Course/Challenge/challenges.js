var Express = require('express');
var Tags = require('../../Validator.js').Tags;
var router = Express.Router({mergeParams: true});
var doErrorResponse = require('../../Validator.js').doErrorResponse;
var sequelize = require('../../sequelize.js');
var Promise = require('bluebird');

function getChallengeModel(req, res, next) {
   var vld = req.validator;

   sequelize.Challenge.scope('teacherScope').findOne({where: {
      CourseName: req.params.courseName,
      sanitizedName: req.params.challengeName
   }})
   .then(function(chl) {
      return vld.check(chl, Tags.notFound, null, chl, "Couldn't find a challenge named " + req.params.challengeName);
   })
   .then(function(chl) {
      req.challenge = chl;
      next();
   })
   .catch(doErrorResponse(res));
}

var attemptRouter = require('./Attempt/attempts.js');
router.use('/:challengeName/attempt', getChallengeModel, attemptRouter);

// Get all weeks, which contain the challenges
router.get('/', function(req, res) {
  return req.course.getWeeks({
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
    return vld.hasFields(req.body, ["name", "description", "type", "answer", "weekIndex", "dayIndex", "tags"]);
  })
  .then(function() {
    return vld.check(Array.isArray(req.body["tags"]), Tags.badValue, {field: "tags"});
  })
  .then(function() {
    if (req.body["type"] === "multchoice") {
      return vld.check(req.body["choices"] &&
      Array.isArray(req.body["choices"]) &&
      req.body["choices"].length >= 2, Tags.badValue, {field: "choices"});
    }
    else if (req.body["type"] === "number") {
      return vld.check(!isNaN(parseInt(req.body["answer"])), Tags.badValue, {field: "answer"});
    }
    else if (req.body["type"] === "shortanswer") {
      var correctTermList = req.body["answer"];
      req.body["answer"] = JSON.stringify(req.body["answer"]);
      return vld.check(Array.isArray(correctTermList)
      && correctTermList.length >= 1, Tags.badValue, {field: "answer"});
    }
    else {
      return Promise.reject({message: 'Invalid type', tags: Tags.badValue});
    }
  });
}

/** Actually make that challenge, everything's good! **/
function makeChallenge(week, req, res) {
  req.body.courseName = req.params.courseName;

  var challengeDate = week.startDate;
  challengeDate.setDate(challengeDate.getDate()+req.body.dayIndex);
  req.body.openDate = challengeDate;

  var makeChallenge = sequelize.Challenge.create(req.body);
  var promiseList = [makeChallenge];

  if (req.body["type"] === "multchoice") {
    for (var ndx = 0; ndx < req.body["choices"].length; ndx++) {
      var answerText = req.body["choices"][ndx];
      var choice = sequelize.MultChoiceAnswer.create({index: ndx, text: answerText});
      promiseList.push(choice);
    }
  }

  var tagPromises = [];
  req.body.tags.forEach(function(tag) {
    var tagPromise = sequelize.ChallengeTag.findOrCreate({where: {text: tag, CourseName: req.params.courseName}});
    tagPromises.push(tagPromise);
  });

  return Promise.all(tagPromises)
  .then(function(tagArr) {
    tagArr = tagArr.map(function(tag) {return tag[0];}); // findOrCreate gives us an array like [ [obj, true], [obj, false] ]

    return Promise.all(promiseList)
    .then(function(arr) {
      console.log(JSON.stringify(arr));
      var newChallenge = arr[0];
      var choices = arr.slice(1);

      var addChlToWeek = week.addChallengesAndSetDate([newChallenge]);
      var addChoicesToChl = newChallenge.addPossibilities(choices);
      var addTagsToChl = newChallenge.addTags(tagArr);

      return Promise.all([addChlToWeek, addChoicesToChl, addTagsToChl]);
    });
  })
  .then(function() {
    res.location(router.baseURL + '/' + req.body.name).sendStatus(200).end();
    return Promise.resolve();
  });
}

/** Make new challenge **/
router.post('/', function(req, res) {
  var vld = req.validator;

  return vld.checkPrsOK(req.course.ownerId)
  .then(function() {
    return validateChallengeData(vld, req)
  })
  .then(function() {
    return req.course.getWeeks({where: {weekIndexInCourse: req.body.weekIndex}});
  })
  .spread(function(week) {
    return vld.check(week, Tags.badValue, {field: "weekIndex"}, week);
  })
  .then(function(week) {
    return week.getChallenges({where: {dayIndex: req.body.dayIndex}})
    .then(function(chls) {
      return vld.check(chls.length === 0, Tags.dupDay, null, week); // verify there's not already a challenge on that day
    });
  })
  .then(function(week) {
    return makeChallenge(week, req, res);
  })
  .catch(doErrorResponse(res));
});

router.get('/:challengeName', function(req, res) {
  var vld = req.validator;

  var scope = 'defaultScope';
  if (req.session.isAdminOrTeacher()) {
    scope = 'teacherScope'; // let teachers see the answer
  }

  sequelize.Challenge.scope(scope).findOne({where:
    {
      sanitizedName: req.params.challengeName,
      courseName: req.params.courseName
    },
    include: [
      {
        model: sequelize.MultChoiceAnswer,
        as: "Possibilities"
      },
      {
        model: sequelize.ChallengeTag,
        as: "Tags"
      },
      {
        model: sequelize.Attempt,
        where: {personId: req.session.id},
        required: false
      }
    ]
  })
  .then(function(chl) {
    return vld.check(chl, Tags.notFound, null, chl, "No challenge found with the name " + req.params.challengeName);
  })
  .then(function(chl) {
    return res.json(chl);
  })
  .catch(doErrorResponse(res));
});

module.exports = router;
