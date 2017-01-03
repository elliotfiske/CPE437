var Sequelize = require('sequelize');
var Promise = require('bluebird');

var sanitize = require("sanitize-filename");

var poolCfg = require('./connection.json');
var env = process.env;

var db = env.CLEARDB_DB_NAME || poolCfg.database;
var username = env.CLEARDB_USERNAME || poolCfg.user;
var pass = env.CLEARDB_PASSWORD || poolCfg.password;
var host = env.CLEARDB_HOST || poolCfg.host;

var sequelize = new Sequelize(db, username, pass, {
  host: host,
  dialect: 'mysql',

  pool: {
    max: 10,
    min: 0,
    idle: 10000
  },

  timestamps: true,
  freezeTableName: true
});

/**** DELETE ME ON THE MAIN BRANCH, MAYBE, LATER, MAYBE ***/
var PeerId = sequelize.define('PeerId', {
   peerid: {
      type: Sequelize.STRING
   },
   name: {
      type: Sequelize.STRING,
      unique: true
   },
   color: {
      type: Sequelize.STRING
   },
   lastHeartbeat: {
      type: Sequelize.DATE
   },
   texture: {
      type: Sequelize.INTEGER
   }
}, {
   freezeTableName: true
});

var Room = sequelize.define('Room', {
   name: {
      type: Sequelize.STRING,
      unique: true
   }
}, {
   freezeTableName: true
});

Room.hasMany(PeerId);
/** OK DON'T DELETE PAST HERE PLZ **/

var Person = sequelize.define('Person', {
  name: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    unique: true
  },
  facebookId: {
    type: Sequelize.STRING,
    unique: true
  },
  password: {
    type: Sequelize.STRING
  },
  role: {
     type: Sequelize.INTEGER
  },
  userSettings: {
     type: Sequelize.STRING,
     default: "{}"
  }
}, {
  freezeTableName: true
});

var Course = sequelize.define('Course', {
  name: {
    type: Sequelize.STRING,
    unique: true
  },
  sanitizedName: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: {
      args: [true],
      msg: "There is already a course named that."
    }
  },
  ownerId: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  hooks: {
    afterCreate: function(newCourse, options) {
      var weekPromises = [];
      var startDate = new Date(process.env.START_DATE);

      for (var ndx = 0; ndx < 10; ndx++) {
        weekPromises.push(
          Week.create({
            weekIndexInCourse: ndx,
            startDate: startDate.getTime(),
          })
        );

        startDate.setDate(startDate.getDate()+7);
      }

      Promise.all(weekPromises)
      .then(function(weeks) {
        console.log("das weeks"  + JSON.stringify(weeks));
        newCourse.setWeeks(weeks);
      })
    },
    beforeValidate: function(course, options) {
      if (course.name) {
        course.name = course.name.trim();
        course.sanitizedName = sanitize(course.name).toLowerCase().replace(/ /g, '-');
      }
    }
  },
  instanceMethods: {
    // Returns true if you're either the owner or enrolled in this course
    checkPersonEnrolled: function(personId, res) {
      if (personId === this.ownerId) {
        return Promise.resolve(true);
      }

      return Person.findById(personId)
      .then(function(person) {
        return this.hasEnrolledDude(person);
      });
    },
    // This returns the current consecutive days the user has answered questions.
    // 0 if they haven't started or missed a day.
    getCurrentStreak: function(personId) {
      var streak = 0;
      this.getWeeks()
      .then(function(weeks) {
        return weeks.getChallenges({
          include: [{
            model: Attempt,
            where: {PersonId: personId}
          }]
        });
      })
      .then(function(chls) {

      });

      // game plan:
      //  CHANGE THIS to "checkMissedStreak"
      //  when the user logs in or whatever, query for all challenges in the past
      //  that do not have attempts on them.
      //
      //  If there is a challenge before today that is missing
    },
  }
});

var Challenge = sequelize.define('Challenge', {
  name: {
    type: Sequelize.STRING
  },
  sanitizedName: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  description: {
    type: Sequelize.TEXT
  },
  attsAllowed: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    validate: {
      min: {
        args: [1],
        msg: "AttsAllowed must be greater than 1"
      }
    }
  },
  type: {
    type: Sequelize.ENUM('multchoice', 'shortanswer', 'number'),
    validate: {
      isIn: {
        args: [['multchoice', 'shortanswer', 'number']],
        msg: "Challenge type must be one of ['multchoice', 'shortanswer', 'number']"
      }
    }
  },
  image: {
    type: Sequelize.STRING
  },
  openDate: {
    type: Sequelize.DATE
  },
  answer: {
    type: Sequelize.STRING
  },
  courseName: {
    type: Sequelize.STRING,
  },
  dayIndex: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  // By default, hide answer
  defaultScope: {
     attributes: { exclude: ['answer'] }
  },
  scopes: {
     teacherScope: {
        // Include answer this time
     },
  },
  instanceMethods: {
     getMostRecentAttempt: function(personId) {
        return this.getAttempts({
           where: {personId: personId},
           order: ['createdAt', 'DESC'],
           limit: 1
        });
     }
  },
  hooks: {
    beforeValidate: function(challenge, options) {
      if (challenge.name) {
        challenge.name = challenge.name.trim();
        challenge.sanitizedName = sanitize(challenge.name).toLowerCase().replace(/ /g, '-');
      }
    }
  },
  indexes: [{
    unique: true,
    fields: ['courseName', 'sanitizedName']
  }]
});

var MultChoiceAnswer = sequelize.define('MultChoiceAnswer', {
  index: {
    type: Sequelize.INTEGER
  },
  text: {
    type: Sequelize.STRING
  }
});

var Attempt = sequelize.define('Attempt', {
  pointsEarned: {
    type: Sequelize.INTEGER
  },
  correct: {
    type: Sequelize.BOOLEAN
  },
  input: {
    type: Sequelize.STRING
  }
}, {
  freezeTableName: true
});

var ChallengeTag = sequelize.define('ChallengeTag', {
   text: {
      type: Sequelize.STRING,
   },
   CourseName: {
      type: Sequelize.STRING,
   }
}, {
   freezeTableName: true,
   indexes: [{
     unique: true,
     fields: ['CourseName', 'text']
   }]
});

var ShopItem = sequelize.define('ShopItem', {
  name: {
    type: Sequelize.STRING
  },
  courseName: {
    type: Sequelize.STRING
  },
  cost: {
    type: Sequelize.INTEGER
  },
  purchased: {
    type: Sequelize.BOOLEAN
  }
}, {
  freezeTableName: true
});

var Week = sequelize.define('Week', {
  weekIndexInCourse: {
    type: Sequelize.INTEGER
  },
  startDate: {
    type: Sequelize.DATE
  }
}, {
  freezeTableName: true,
  instanceMethods: {
    // TODO: moving challenges around will happen here :3
    addChallengesAndSetDate: function(challenges) {
      challenges.forEach(function(chl) {
        chl.openDate = "test this out";
      });
      return this.addChallenges(challenges);
    }
  }
});

/* ASSOCIATIONS! */
ShopItem.belongsToMany(Person, {through: 'StudentPurchase'});
Person.belongsToMany(ShopItem, {through: 'StudentPurchase'});

var Enrollment = sequelize.define('Enrollment', {
   creditsEarned: {
      type: Sequelize.INTEGER,
      defaultValue: 0
   },
   streak: {
      type: Sequelize.INTEGER,
      defaultValue: 0
   },
   lastStreakTime: {
      type: Sequelize.DATE, // last time the user made an attempt that counts towards streak,
      defaultValue: new Date(0)
   },
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
   }
}, {
   freezeTableName: true
});

Course.belongsToMany(Person, {as: "EnrolledDudes", through: Enrollment, foreignKey: "courseName"});
Person.belongsToMany(Course, {as: "Classes", through: Enrollment, foreignKey: "personId"});

Challenge.hasMany(MultChoiceAnswer, {as: 'Possibilities'});

// Question Tags
Course.hasMany(ChallengeTag, {foreignKey: "CourseName"});
Challenge.belongsToMany(ChallengeTag, {through: "AssignedTags", as: "Tags"});
ChallengeTag.belongsToMany(Challenge, {through: "AssignedTags", as: "AssociatedChallenges"});

Challenge.hasMany(Attempt, {foreignKey: "challengeName"});
Person.hasMany(Attempt, {foreignKey: "personId"});

Course.hasMany(Week);
Week.hasMany(Challenge);
Challenge.belongsTo(Week);

sequelize.sync().then(function() {
   return Person.findOrCreate({
      where: {email: 'Admin@11.com'},
      defaults: {name: 'AdminMan', password: "password", role: 2}
   });
})
.then(function(ok) {
   console.log(JSON.stringify(ok));
})
.catch(function(err) {
   console.error("EXTREMELY UNLIKELY ERROR DETECTED " + JSON.stringify(err.message));
});

module.exports = {
   PeerId: PeerId,
   Course: Course,
   Week: Week,
   Person: Person,
   Challenge: Challenge,
   Attempt: Attempt,
   ShopItem: ShopItem,
   Enrollment: Enrollment,
   MultChoiceAnswer: MultChoiceAnswer,
   ChallengeTag: ChallengeTag,
   do: sequelize
};
