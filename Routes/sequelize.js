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
  }
}, {
  freezeTableName: true
});

var Course = sequelize.define('Course', {
  name: {
    type: Sequelize.STRING,
    unique: true,
    primaryKey: true
  },
  ownerId: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  hooks: {
    beforeCreate: function(newCourse, options) {
      var weekPromises = [];
      var startDate = new Date(process.env.START_DATE);

      for (var ndx = 0; ndx < 10; ndx++) {
        weekPromises.push(
          Week.create({
            weekIndexInCourse: ndx,
            startDate: startDate.getTime()
          })
        );

        startDate.setDate(startDate.getDate()+7);
      }

      Promise.all(weekPromises)
      .then(function(weeks) {
        console.log("das weeks"  + JSON.stringify(weeks));
        newCourse.setWeeks(weeks);
      })
    }
  }
});

var Challenge = sequelize.define('Challenge', {
  name: {
    type: Sequelize.STRING
  },
  sanitizedName: {
    type: Sequelize.STRING,
  },
  description: {
    type: Sequelize.TEXT
  },
  attsAllowed: {
    type: Sequelize.INTEGER,
    defaultValue: 1
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
  answer: {
    type: Sequelize.STRING
  },
  openTime: {
    type: Sequelize.DATE
  },
  courseName: {
    type: Sequelize.STRING,
  },
  dayIndex: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  instanceMethods: {
    getOpenDate: function() {
      console.log("Test what 'this' is: " + JSON.stringify(this));
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
    unique: {
      args: true,
      msg: "test this message thing out"
    },
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
  ownerId: {
    type: Sequelize.INTEGER
  },
  challengeName: {
    type: Sequelize.STRING
  },
  score: {
    type: Sequelize.INTEGER
  },
  startTime: {
    type: Sequelize.DATE
  },
  input: {
    type: Sequelize.STRING(1024)
  }
}, {
  freezeTableName: true
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
  freezeTableName: true
});

/* ASSOCIATIONS! */
ShopItem.belongsToMany(Person, {through: 'StudentPurchase'});
Person.belongsToMany(ShopItem, {through: 'StudentPurchase'});

var Enrollment = sequelize.define('Enrollment', {
  creditsEarned: {
    type: Sequelize.INTEGER,
    defaultValue: 0
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

Course.hasMany(Challenge, {as: "Challenges", foreignKey: "courseName"});

Challenge.hasMany(MultChoiceAnswer, {as: 'Possibilities'});

Course.hasMany(Week);
Week.hasMany(Challenge, {as: "DailyChallenges"})

sequelize.sync({force: true}).then(function() {
  return Person.findOrCreate({
    where: {email: 'Admin@11.com'},
    defaults: {name: 'AdminMan', password: "password", role: 2}});
})
.then(function(ok) {
  console.log(JSON.stringify(ok));
});

//
// var makeCourse = Course.findOrCreate({
//   where: {name: "myCourse"},
//   defaults: {ownerId: 1}
// });
//
// Promise.all([makeAdmin, makeCourse])
// .then(function(arr) {
//   var newAdmin = arr[0];
//   var newCourse = arr[1];
//   console.log(JSON.stringify(newAdmin));
//   newAdmin[0].setClasses([newCourse[0]]);
// })
// .then(function() {
//   console.log("GREAT SUCC!");
// });


module.exports = {
  Course: Course,
  Week: Week,
  Person: Person,
  Challenge: Challenge,
  Attempt: Attempt,
  ShopItem: ShopItem,
  Enrollment: Enrollment,
  MultChoiceAnswer: MultChoiceAnswer
};
