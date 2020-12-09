const axios = require("axios")
const apiKey = "AIzaSyC8lLbws8m70ij1d39sdqg8uxSUuYAfBuI"
const app = require("express")

app.get("/restaurants", async (req, res) => {

  try {   
      
      const {data} = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.8670522,151.1957362&radius=1500&type=restaurant&key=${apiKey}`
      )

    res.json(data)

  }
  catch(err) {
    
  }

})

