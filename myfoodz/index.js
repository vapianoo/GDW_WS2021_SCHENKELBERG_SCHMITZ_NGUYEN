require('dotenv').config()
const axios = require("axios")
const app = require("express")()
const PORT = 3000




app.get("/restaurants", async (req, res) => {

  try {

    const { data } = await

      axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=51.0266668,7.569283&radius=500&type=restaurant&key=${process.env.API_KEY}`
      ).then(function (response) {
        console.log(response.data)

      })

    status()

    res.json(data)

  }
  catch (err) {

  }

})



app.listen(PORT, function () {
  console.log(`Server running on PORT: ${PORT}`)
});



