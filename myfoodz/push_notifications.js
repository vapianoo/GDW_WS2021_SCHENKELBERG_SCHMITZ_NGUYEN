/*###################################################################*/
/*                                                                   */
/*                      PUSH-NOTIFICATIONS                           */
/*                                                                   */
/*###################################################################*/

//Pushy setup
const Pushy = require('pushy');
const pushyAPI = new Pushy(process.env.PUSHY_KEY);
const push_notifications = require('./push_notifications.json');
const db = require('./database')

// PUSH NOTIFICATION
const sendNotification = async (group, type) => {
    const users = await group.getUsers();
  
    for (const user of users) {
      const to = user.pushyToken;
      if (to === null) {
        console.log("User not subscribed for notifications")
      } else {
        const data = push_notifications[type].message;
  
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
  }

module.exports = {
    sendNotification,
}