require("dotenv").config();
const axios = require("axios");
const app = require("express")();
const bodyParser = require("body-parser");
// const { ForeignKeyConstraintError } = require("sequelize");
// const { json } = require("sequelize/types");
const { promisify } = require("util");

//const authMiddleware = require("./auth");
const db = require("./database");
app.use(bodyParser.json());
//app.use(authMiddleware);

const startServer = async () => {
  await db.initializeDatabase(app);

  const port = process.env.SERVER_PORT || 3000;
  await promisify(app.listen).bind(app)(port);
  console.log(`Listening on Port ${port}`);
};

startServer();

app.post("/groups/:groupId/suggestions", async (req, res) => {
  const { groupId } = req.params;

  const group = await db.Group.findByPk(groupId);
  if (group === null) {
    res.json("group not found");
  }

  const address = group.groupAddress;
  const minRating = group.groupMinRating;

  const { data: geoData } = await axios
    .get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.API_KEY}`
    )
    .catch((err) => {
      res.json("couldnt retrieve address " + err);
    });

  const lat = geoData.results[0].geometry.location.lat;
  const lng = geoData.results[0].geometry.location.lng;

  const { data } = await axios
    .get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=restaurant&key=${process.env.API_KEY}`
    )
    .catch((err) => {
      res.json("couldnt retrieve restaurants " + err);
    });

  const filtered = data.results.filter((a) => a.rating >= minRating);
  var restaurantIds = [];

  for (const item of filtered) {
    const [restaurant, created] = await db.Restaurant.findOrCreate({
      where: { name: item.name },
      defaults: {
        name: item.name,
        rating: item.rating,
        price_level: item.price_level,
      },
    }).catch((err) => {
      res.json("creating restaurant failed " + err);
    });
    restaurantIds.push(restaurant.id);
  }

  restaurantIds = restaurantIds.slice(0, 5);

  for (let i = 0; i < restaurantIds.length; i++) {
    const [suggestion, created] = await db.Suggestion.findOrCreate({
      where: { groupId: groupId, restaurantId: restaurantIds[i] },
      defaults: {
        groupId: groupId,
        restaurantId: restaurantIds[i],
        votes: 0,
      },
    }).catch((err) => {
      res.json("creating suggestion failed" + err);
    });
    if (!created) {
      suggestion.votes = 0;
    }
    group.addSuggestion(suggestion);
  }
  group.save();

  const sugNr = await group.countSuggestions();
  res.json(sugNr + " suggestions were made");
});

app.get("/groups/:groupId/suggestions", async (req, res) => {
  const { groupId } = req.params;

  const group = await db.Group.findByPk(groupId, { include: db.Suggestion });
  if (group === null) {
    res.json("group not found");
  }

  if ((await group.countSuggestions()) > 0) {
    res.json(await group.getSuggestions());
  } else {
    res.json("no suggestions found");
  }
});

app.delete("/groups/:groupId/suggestions", async (req, res) => {
  const { groupId } = req.params;
  const group = await db.Group.findByPk(groupId);

  await db.Suggestion.destroy({
    where: { groupId: groupId },
  }).catch((err) => {
    res.json("error " + err);
  });

  await group.setSuggestions([]);

  group.save();

  res.json("suggestions deleted");
});

app.post(
  "/groups/:groupId/suggestions/:typeOfVote/:voteId",
  async (req, res) => {
    const { groupId } = req.params;
    const { typeOfVote } = req.params;
    const { voteId } = req.params;

    if (typeOfVote == 1) {
      const suggestion = await db.Suggestion.findOne({
        where: { id: voteId, groupId: groupId },
      });
      if (suggestion === null) {
        res.send("suggestion not found")
      } else {
        suggestion.votes++;
        suggestion.save();
      }
    } else if (typeOfVote == 2) {
      const suggestion = await db.Suggestion.findOne({
        where: { groupId: groupId, restaurantId: voteId },
      });
      if (suggestion === null) {
        res.send("suggestion not found")
      } else {
        suggestion.votes++;
        suggestion.save();
      }
    } else {
      res.send("typeOfVote not accepted");
    }

    res.send("vote successful");
  }
);
