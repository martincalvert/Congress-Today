/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

const handlers = {
    'LaunchRequest': function () {
        this.emit('StartIntent');
    },
    'StartIntent': function () {
        if (this.attributes['zip']){
            this.emit('WhichChamberIntent');
        } else {
          this.emit('AskZipCodeIntent');
        }
    },
    'AskZipCodeIntent': function () {
      this.emit(':ask', 'What is your zip code')
    },
    'StoreZipCodeIntent': function () {
      if (this.event.request.intent.slots.zip.value){
        this.attributes['zip'] = this.event.request.intent.slots.zip.value;
        this.attributes['reps'] = fetchReps(this.attributes['zip'], (results) => {
                console.log(results)
                return results;
            });
        this.emit('WhichChamberIntent');
      } else {
          this.emit('AskZipCodeIntent')
      }
    },
    'WhichChamberIntent': function(){
      this.emit(':ask', 'Would you like to know your house or senate represenatives?')
    },
    'HouseRepIntent': function () {
        var ret = ''
        this.attributes['reps'].house.forEach(function(value, index){
          if (ret.length > 0){
            ret = ret + ' and ' + value
          } else {
            ret = value
          }
        })
        this.emit(':tell', 'Your house represenative is ' + ret);
    },
    'SenateRepIntent': function () {
      var ret = ''
      console.log(this.attributes['reps'])
      console.log(this.attributes)
      this.attributes['reps'].senate.forEach(function(value, index){
        if (ret.length > 0){
          ret = ret + ' and ' + value
        } else {
          ret = value
        }
      })
      this.emit(':tell', 'Your senate represenatives are ' + ret);
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

var https = require('https');

function fetchReps(zip, callback){
  var options = {
    host: 'www.googleapis.com',
    path: '/civicinfo/v2/representatives?key=**keyhere**&address=' + String(zip),
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  var retData = '';
  var ret = {};
  var req = https.request(options, res => {
    res.on('data', chunk => {
      retData = retData + chunk;
    });

    res.on('end', () => {
        var json = JSON.parse(retData);
        var senateIndices = json.offices[2].officialIndices;
        var houseIndices = json.offices[3].officialIndices;

        ret['senate'] = []
        senateIndices.forEach(function(value, index){
            ret['senate'].push(json.officials[value].name)
        })

        ret['house'] = []
        houseIndices.forEach(function(value, index){
            ret['house'].push(json.officials[value].name)
        })

        callback(ret);
    })
  });

  req.end()
}

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.registerHandlers(handlers);
    alexa.execute();
};
