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
  freezeTableName: true,
  instanceMethods: {
    // TODO: moving challenges around will happen here :3
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

Course.hasMany(Week);
Week.hasMany(Challenge);

sequelize.sync().then(function() {
  return Person.findOrCreate({
    where: {email: 'Admin@11.com'},
    defaults: {name: 'AdminMan', password: "password", role: 2}});
  })
  .then(function(ok) {
    console.log(JSON.stringify(ok));
  })
  .catch(function(err) {
    console.error("EXTREMELY UNLIKELY ERROR DETECTED " + JSON.stringify(err));
  });

  module.exports = {
    Course: Course,
    Week: Week,
    Person: Person,
    Challenge: Challenge,
    Attempt: Attempt,
    ShopItem: ShopItem,
    Enrollment: Enrollment,
    MultChoiceAnswer: MultChoiceAnswer,
    do: sequelize
  };
