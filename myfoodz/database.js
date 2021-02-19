const Sequelize = require("sequelize");
const finale = require("finale-rest");

const database = new Sequelize({
  dialect: "sqlite",
  storage: ".database/.sqlite",
});

const Group = database.define("groups", {
  groupAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  groupMinRating: {
    type: Sequelize.INTEGER,
  },
});

const User = database.define("users", {
  userName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Group,
      key: 'id'
    },
  },
});
Group.hasMany(User, {
  foreignKey: 'groupId'
})
User.belongsTo(Group);

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
  votes: {
    type: Sequelize.STRING,
    //allowNull: false,
  },
});

const Suggestion = database.define("suggestions", {
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Group,
      key: 'id'
    },
  },
  restaurantId: {
    type: Sequelize.INTEGER,
    //allowNull: false,
    references: {
      model: Restaurant,
      key: 'id'
    }
  },
  votes: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
});
Group.hasMany(Suggestion, {
  foreignKey: 'groupId'
})
Suggestion.belongsTo(Group)
Suggestion.belongsTo(Restaurant)


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

module.exports = {
  initializeDatabase,
  Restaurant,
  User,
  Group,
  Suggestion,
};
