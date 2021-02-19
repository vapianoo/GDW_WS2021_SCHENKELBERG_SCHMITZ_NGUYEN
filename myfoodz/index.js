require("dotenv").config();
const axios = require("axios");
const app = require("express")();
const bodyParser = require("body-parser");
// const { ForeignKeyConstraintError } = require("sequelize");
// const { json } = require("sequelize/types");
const { promisify } = require("util");
const db = require("./database");

//Pushy setup
const Pushy = require('pushy');
const pushyAPI = new Pushy(process.env.PUSHY_KEY);
import push_notifications from ('./push_notifications.json');

/*      Uncomment following two lines to enable authentication       */
/*                                                                   */
/*  Clients will need:                                               */
/*    ISSUER        - Address of authentication server               */
/*    SCOPE         - (eg. admin, user)                              */
/*    CLIENT_ID,                                                     */
/*    CLIENT_SECRET - used to fetch token from authentication server */
/*                                                                   */

//const authMiddleware = require("./auth");
//app.use(authMiddleware);

app.use(bodyParser.json());

//Initializes database, app starts listening on specified port
const startServer = async () => {
  await db.initializeDatabase(app);

  const port = process.env.SERVER_PORT || 3000;
  await promisify(app.listen).bind(app)(port);
  console.log(`Listening on Port ${port}`);
};

startServer();

//REQUEST HANDLING

//Fetches restaurants from Google PlacesAPI,
//posts suggestions and associates them with group
app.post("/groups/:groupId/suggestions", async (req, res) => {
  const { groupId } = req.params;

  const group = await db.Group.findByPk(groupId);
  if (group === null) {
    res.json("group not found");
  }

  const address = group.groupAddress;
  const minRating = group.groupMinRating;

  //Fetches geo-coordinates from Google GeocodingAPI
  const { data: geoData } = await axios
    .get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.API_KEY}`
    )
    .catch((err) => {
      res.json("couldnt retrieve address " + err);
    });

  const lat = geoData.results[0].geometry.location.lat;
  const lng = geoData.results[0].geometry.location.lng;

  //Requests restaurant data
  const { data } = await axios
    .get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=restaurant&key=${process.env.API_KEY}`
    )
    .catch((err) => {
      res.json("couldnt retrieve restaurants " + err);
    });

  //Filtering restaurant data (eg. minRating)
  const filtered = data.results.filter((a) => a.rating >= minRating);
  var restaurantIds = [];

  //Posts restaurants to database
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
    if (!created) {
      restaurant.rating = item.rating;
      restaurant.price_level = item.price_level;
      restaurant.save();
    }

    restaurantIds.push(restaurant.id);
  }

  restaurantIds = restaurantIds.slice(0, 5);

  //Posts suggestions for the first 5 restaurants filtered
  //and associates them with the group
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

  sendNotification(group, 1);

  const sugNr = await group.countSuggestions();
  res.json(sugNr + " suggestions were made");
});

//Gets suggestions associated with source group
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

//Deletes suggestions associated with source group
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

//Posts a vote for a suggestion either by
//suggestionId (:typeOfVote = 1) or restaurantId (:typeOfVote = 2)
app.post(
  "/groups/:groupId/suggestions/:typeOfVote/:voteId",
  async (req, res) => {
    const { groupId } = req.params;
    const { typeOfVote } = req.params;
    const { voteId } = req.params;

    const group = await db.Group.findByPk(groupId);
    const userCount = await group.countUsers();

    if (typeOfVote == 1) {
      const suggestion = await db.Suggestion.findOne({
        where: { id: voteId, groupId: groupId },
      });
      if (suggestion === null) {
        res.send("suggestion not found");
      } else {
        suggestion.votes++;
        if (suggestion.votes > userCount / 2) {
          sendNotification(group, 0);
        }
        suggestion.save();
      }
    } else if (typeOfVote == 2) {
      const suggestion = await db.Suggestion.findOne({
        where: { groupId: groupId, restaurantId: voteId },
      });
      if (suggestion === null) {
        res.send("suggestion not found");
      } else {
        suggestion.votes++;
        if (suggestion.votes > userCount / 2) {
          sendNotification(group, 0);
        }
        suggestion.save();
      }
    } else {
      res.send("typeOfVote not accepted");
    }

    res.send("vote successful");
  }
);

//Reset votes for current lineup of suggestions
app.put("/groups/:groupId/test", async(req,res) => {

  const { groupId } = req.params;

  const group = await db.Group.findByPk(groupId);

  const suggestions = await group.getSuggestions()

  for(const suggestion of suggestions) {
     suggestion.votes = 0;
     suggestion.save();
  }

  sendNotification(group, 2);

  res.send("votes have been reset");
})

// PUSH NOTIFICATION
const sendNotification = async (group, type) => {
  const users = await group.getUsers();

  for (const user of users) {
    const to = user.pushyToken;
    const data = push_notifications[type];

    pushyAPI.sendPushNotification(data, to, function (err, id) {
      // Log errors to console 
      if (err) {
          return console.log('Fatal Error', err);
      }
      
      // Log success 
      console.log('Push sent successfully! (ID: ' + id + ')');
  });
  }
}