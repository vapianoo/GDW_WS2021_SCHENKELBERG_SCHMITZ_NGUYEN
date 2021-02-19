const Sequelize = require("sequelize");
const finale = require("finale-rest");

// Create new database of type Sequelize using sqlite dialect
const database = new Sequelize({
  dialect: "sqlite",
  storage: ".database/.sqlite",
});

//Define database models incl. associations
//Group model consists of name, address and filter criteria like a minimum restaurant rating
const Group = database.define("groups", {
  groupName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  groupAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  groupMinRating: {
    type: Sequelize.INTEGER,
  },
});

//User model saves a username, email and a foreignKey of the group, the user is part of
const User = database.define("users", {
  userName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userMail: {
    type: Sequelize.STRING,
  },
  pushyToken: {
    type: Sequelize.STRING,
  },
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Group,
      key: "id",
    },
  },
});
//Modeling associations in Sequelize
//has -> foreignKey is saved in target model
//belongs -> foreignKey is saved in source model
Group.hasMany(User, {
  foreignKey: "groupId",
});
User.belongsTo(Group);

//Restaurant model consists of the name of the restaurant, its rating,
//and some optional parameters that may be used for filtering
const Restaurant = database.define("restaurants", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  rating: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  price_level: {
    type: Sequelize.FLOAT,
    //allowNull: false
  },
  cuisine: {
    type: Sequelize.STRING,
    //allowNull: false,
  },
});

//Suggestions belong to a specific group and restaurant
//and can be voted for, indicating the groups preference
const Suggestion = database.define("suggestions", {
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Group,
      key: "id",
    },
  },
  restaurantId: {
    type: Sequelize.INTEGER,
    //allowNull: false,
    references: {
      model: Restaurant,
      key: "id",
    },
  },
  votes: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
});
Group.hasMany(Suggestion, {
  foreignKey: "groupId",
});
Suggestion.belongsTo(Group);
Suggestion.belongsTo(Restaurant);

//Initialize database with app(express) and set default endpoints,
//that allow to GET, POST, PUT, and DELETE by default 
const initializeDatabase = async (app) => {
  finale.initialize({ app, sequelize: database });

  finale.resource({
    model: User,
    endpoints: ["/users", "/users/:id"],
  });

  finale.resource({
    model: Group,
    endpoints: ["/groups", "/groups/:id"],
  });

  finale.resource({
    model: Restaurant,
    endpoints: ["/restaurants", "/restaurants/:id"],
  });

  finale.resource({
    model: Suggestion,
    endpoints: ["/suggestions", "/suggestions/:id"],
  });

  await database.sync();
};

//Export database and its models to be used for request handling
module.exports = {
  initializeDatabase,
  Restaurant,
  User,
  Group,
  Suggestion,
};
