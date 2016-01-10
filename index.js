require('dotenv').load();

var jsonQuery = require('json-query')
var http = require('http');
var AlexaSkill = require('./AlexaSkill');
var APP_ID = process.env.APP_ID;

var fighters_url = "http://ufc-data-api.ufc.com/api/v1/us/fighters";

var getFighterJsonFromUfc = function (callback) {

  console.log("entered getFighterJsonFromUfc()");
  console.log("Attempting url: " + fighters_url);

  http.get(fighters_url, function (res) {

    console.log("Got response: " + res.statusCode);

    var body = '';

    res.on('data', function (data) {
      body += data;
    });

    res.on('end', function () {
      var result = JSON.parse(body);
      callback(result);
    });

  }).on('error', function (e) {
    console.log('Error: ' + e);
  });
};

var searchFighter = function (query, queryReturn) {

  console.log("entered searchFighter()")

  query = query.charAt(0).toUpperCase() + query.slice(1);

  getFighterJsonFromUfc(function (data) {

    console.log("Retrieved fighter JSON from the UFC");
    console.log("querying the JSON file for " + query);

    var fighter = jsonQuery(['[last_name=?]', query], {
      data: data
    });

    queryReturn(fighter);

  });
};

var handleNextFighterRequest = function (intent, session, response) {
  console.log("entered handleNextFighterRequest()");
  searchFighter(intent.slots.fighter.value, function (fighter) {

    console.log("called searchFighter() from handleNextFighterRequest()");

    if (fighter.value.last_name) {
      var text = fighter.value.first_name + " " + fighter.value.last_name + " fights at " + fighter.value.weight_class.replace(/_/gi, ' ') + " and has a fight record of " + fighter.value.wins + " wins, " + fighter.value.losses + " losses, and " + fighter.value.draws + " draws.";
      var cardText = text;
    } else {
      var text = 'Unable to find that Fighter';
      var cardText = text;
    }

    var heading = 'Found UFC fighter: ' + intent.slots.fighter.value;
    response.tellWithCard(text, heading, cardText);
  });
};

var UfcFighter = function () {
  AlexaSkill.call(this, APP_ID);
};

UfcFighter.prototype = Object.create(AlexaSkill.prototype);
UfcFighter.prototype.constructor = UfcFighter;

UfcFighter.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  // What happens when the session starts? Optional
  console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
};

UfcFighter.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
  // This is when they launch the skill but don't specify what they want.
  var output = 'UFC Fighter. ' +
    'Say the name of the UFC fighter you would like to lookup';

  var reprompt = 'Which fighter do you want to lookup?';

  response.ask(output, reprompt);

  console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
};

UfcFighter.prototype.intentHandlers = {
  GetNextFighterIntent: function (intent, session, response) {
    handleNextFighterRequest(intent, session, response);
  },

  HelpIntent: function (intent, session, response) {
    var speechOutput = 'Lookup active UFC fighters, ' +
      'Which fighter would you like to lookup?';
    response.ask(speechOutput);
  }
};

exports.handler = function (event, context) {
  var skill = new UfcFighter();
  skill.execute(event, context);
};
