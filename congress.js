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
var https = require('https');

const handlers = {
    'LaunchRequest': function () {
      this.emit('StartIntent');
    },
    'StartIntent': function () {
      this.emit(':ask', 'What would you like to know? You can ask about senate bills, house bills, or your represenatives.')
    },
    'CongressBillsIntent': function() {
      const chamber = this.event.request.intent.slots.chamber.value
      fetchBills(chamber, (results) => {
        const theResults = results;
        var response = `Upcoming ${chamber} bills are: `;
        theResults.forEach(result => {
          response = `${response} ${result.name} ${result.description}`
        })
        this.emit(':tell', response)
      })
    },
	  'Unhandled': function () {
        this.emit(':ask', 'What would you like to know? You can ask about senate bills, house bills, or your represenatives.');
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
        this.emit(':tell', 'Have a nice day');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

// function fetchReps(zip, callback){
//   var options = {
//     host: 'www.googleapis.com',
//     path: '/civicinfo/v2/representatives?key=' + process.env.key + '&address=' + String(zip),
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   };
//   var retData = '';
//   var ret = {};
//   var req = https.request(options, res => {
//     res.on('data', chunk => {
//       retData = retData + chunk;
//     });
//
//     res.on('end', () => {
//         var json = JSON.parse(retData);
//         var senateIndices = json.offices[2].officialIndices;
//         var houseIndices = json.offices[3].officialIndices;
//
//         json.offices.forEach(function(value, index){
//           if (value.name == 'United States Senate'){
//             senateIndices = value.officialIndices
//           }
//           if (value.name.starsWith('United States House of Representatives')){
//             houseIndices = value.houseIndices
//           }
//         })
//
//         ret['senate'] = []
//         senateIndices.forEach(function(value, index){
//             ret['senate'].push(json.officials[value].name)
//         })
//
//         ret['house'] = []
//         houseIndices.forEach(function(value, index){
//             ret['house'].push(json.officials[value].name)
//         })
//
//         callback(ret);
//     })
//   });
//
//   req.end();
// }

function fetchBills(chamber, callback) {
  var options = {
    host: 'api.propublica.org',
    path: `/congress/v1/bills/upcoming/${chamber}.json`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.PROPUBLICA_KEY
    }
  };

  var retData = '';
  var ret = {};
  var req = https.get(options, res => {
    res.on('data', chunk => {
      retData = retData + chunk;
    });

    res.on('end', () => {
      var json = JSON.parse(retData);

      var bills = []

      var date = new Date()

      var dateString = `${date.getFullYear()}-0${date.getMonth()}-${date.getDay()}`

      var dateBills = json.results.find(day => {
        return day.date == dateString
      })

      if (dateBills === undefined) {
        dateBills = json.results[0]
      }

      // var bills = handleBills(dateBills);
      dateBills.bills.forEach(async (item, index) => {
        // if (index > 2) {
        //   callback(bills)
        // }
        await fetchBill(item.bill_slug).then(results => {
          var temp = {
            name: results.bill.replace(/./g, ' '),
            description: results.short_title
          };
          bills.push(temp);
        })
      })

      callback(bills)
    })
  })
}

function fetchBill(billSlug) {
  var options = {
    host: 'api.propublica.org',
    path: `/congress/v1/115/bills/${billSlug}.json`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.PROPUBLICA_KEY
    }
  };

  var retData = '';
  var ret = {};
  return new Promise((resolve, reject) => {
    var req = https.get(options, res => {
      res.on('data', chunk => {
        console.log('getting data')
        retData = retData + chunk;
      });

      res.on('end', () => {
        var json = JSON.parse(retData);
        resolve(json.results[0]);
      });
    })
  })
}

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.registerHandlers(handlers);
    alexa.execute();
};
