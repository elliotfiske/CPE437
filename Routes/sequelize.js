var Sequelize = require('sequelize');
var Promise = require('bluebird');

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
Person.sync();

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
  freezeTableName: true
});
Course.sync();

var Challenge = sequelize.define('Challenge', {
  name: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
  attsAllowed: {
    type: Sequelize.INTEGER
  },
  courseName: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.ENUM('mult_choice', 'shortanswer', 'number')
  },
  image: {
    type: Sequelize.STRING
  },
  answer: {
    type: Sequelize.STRING
  },
  openTime: {
    type: Sequelize.DATE
  }
}, {
  freezeTableName: true
});
Challenge.sync();

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
Attempt.sync();

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
ShopItem.sync();

var Week = sequelize.define('Week', {
  weekNameTest: {
    type: Sequelize.STRING
  },
  weekNum: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true
});
Week.sync();

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
Enrollment.sync();

Challenge.hasMany(MultChoiceAnswer, {as: 'Possibilities'});
MultChoiceAnswer.sync();

var makeAdmin = Person.findOrCreate({
  where: {email: 'Admin@11.com'},
  defaults: {name: 'AdminMan', password: "password", role: 2}});

var makeCourse = Course.findOrCreate({
  where: {name: "myCourse"},
  defaults: {ownerId: 1}
});

Promise.all([makeAdmin, makeCourse])
.then(function(arr) {
  var newAdmin = arr[0];
  var newCourse = arr[1];
  console.log(JSON.stringify(newAdmin));
  newAdmin[0].setClasses([newCourse[0]]);
})
.then(function() {
  console.log("GREAT SUCC!");
});

Challenge.findOrCreate({
  where: {name: "testChallenge", courseName: "myCourse"},
  defaults: {attsAllowed: 5, type: 'shortanswer'}
})
.then(function(arr) {
  // return MultChoiceAnswer.create({index: 5, text: "test me out"}).then(function(answer) {
  //   return arr[0].addPossibilities([answer]);
  // });
  return arr[0].getPossibilities();
})
.then(function(stuff) {
  console.log(stuff);
})
.catch(function(err){
  console.log("Whatever, " + err);
});


sequelize.sync();

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
