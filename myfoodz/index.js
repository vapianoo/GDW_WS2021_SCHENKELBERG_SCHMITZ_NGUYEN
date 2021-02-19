/*###################################################################*/
/*                                                                   */
/*                     SERVER-SETUP AND ROUTING                      */
/*                                                                   */
/*###################################################################*/      

require("dotenv").config();
const app = require("express")();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const { promisify } = require("util");

/*###################################################################*/
/*                                                                   */
/*      Uncomment following two lines to enable authentication       */
/*                             -Okta-                                */
/*  Clients will need:                                               */
/*    ISSUER        - Address of authentication server               */
/*    SCOPE         - (eg. admin, user)                              */
/*    CLIENT_ID,                                                     */
/*    CLIENT_SECRET - used to fetch token from authentication server */
/*                                                                   */
/*###################################################################*/

// const authMiddleware = require("./auth");
// app.use(authMiddleware);

const db = require('./database')

//Initializes database, app starts listening on specified port
const startServer = async () => {
  await db.initializeDatabase(app);

  const port = process.env.SERVER_PORT || 3000;
  await promisify(app.listen).bind(app)(port);
  console.log(`Listening on Port ${port}`);
};

startServer();

const handlers = require('./handlers')

app.post("/groups/:groupId/suggestions", handlers.postSuggestions)

app.get("/groups/:groupId/suggestions", handlers.getSuggestions)

app.delete("/groups/:groupId/suggestions", handlers.deleteSuggestions)

app.put("/groups/:groupId/suggestions/:typeOfVote/:voteId", handlers.putVote)

app.put("/groups/:groupId/suggestions/reset", handlers.resetSuggestions)

app.put("/users/:userId/pushyToken", handlers.setPushyToken)