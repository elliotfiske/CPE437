var Sequelize = require('sequelize');
var Promise = require('bluebird');
var crypto = require('crypto');
var bcrypt = require('bcrypt');

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
    max: 5,
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
   },
   activationToken: {
      type: Sequelize.STRING
   }
}, {
   freezeTableName: true,
   hooks: {
      beforeCreate: function(newUser, options) {
         newUser.activationToken = crypto.randomBytes(16).toString('hex');
         newUser.password = Person.generateHash(newUser.password);
         console.log("Hey man is this working", newUser.password);
      },
   },
   instanceMethods: {
      validPassword: function(password) {
         return bcrypt.compareSync(password, this.password);
      },
   },
   classMethods: {
      // Given password, returns salted hash (mmm, salted hashes)
      generateHash: function(password) {
         var salt = bcrypt.genSaltSync(8);
         var hash =  bcrypt.hashSync(password, salt);
         return hash;
      },
   },
   defaultScope: {
      attributes: { exclude: ['activationToken', 'password'] }
   },
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
         .catch(function(err) {
            console.error("OH NO OH NO weeks broke ", err);
         });
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
   },
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
   }
}, {
   freezeTableName: true
});

Course.belongsToMany(Person, {as: "EnrolledDudes", through: Enrollment, foreignKey: "courseName"});
Person.belongsToMany(Course, {as: "Classes", through: Enrollment, foreignKey: "personEmail", targetKey: "email"});

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

sequelize.sync({force: true}).then(function() {
   return Person.scope(null).findOrCreate({
      where: {email: 'Admin@11.com'},
      defaults: {name: 'AdminMan', password: process.env.ADMIN_PASSWORD, role: 2}
   });
})
.then(function(admin) {
   return admin[0].update({
      activationToken: null
   });
})
.then(function(ok) {
   console.log(JSON.stringify(ok));
})
.catch(function(err) {
   console.error("EXTREMELY UNLIKELY ERROR DETECTED " + JSON.stringify(err.message), err.stack);
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
