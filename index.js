const express = require('express');
const app = express();


// SECRET VARIABLE
var PORT = process.env.PORT;

/*
 Imports the express library.
 This is necessary to have an express server.
*/
const bodyParser = require('body-parser');  // Node.js body parsing middleware.


//Telling the app what modules / packages to use
app.use(bodyParser.json());
// Express modules / packages

app.use(bodyParser.urlencoded({ extended: true }));
// Express modules / packages
//APP USE
app.use(express.static('client'));

// ROUTE Bookink Chatbot Server
const bcserverapp = require("./bcserver/server.js");
const bcserverRoute = bcserverapp.router;
app.use("/bcserver", bcserverapp);

// ROUTE Smoobu Connector
//const smoobuConnectorapp = require("./smoobuConnector/smoobuService.js");
//const smoobuConnectorRoute = smoobuConnectorapp.router;
//app.use("/smoobuConnector", smoobuConnectorapp);

app.get('/', (req, res) => {
  res.send('Hello Express app!'); 
})


app.listen(PORT, function(err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
