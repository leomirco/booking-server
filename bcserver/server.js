//userkey=rDrR1eOnRuibLF0hJcrNBzHBrN9krRidZLKy9KVtc8
"use strict";
const express = require("express");
const router = express.Router();
// BODY PARSER
const bodyParser = require('body-parser');
// CONNECTOR API SMOOBU
const { smoobuService } = require('../smoobuConnector/smoobuService');
// DEFINE ASSERT
var assert = require('assert');
// SECRET VARIABLE
var PORT = process.env.PORT;
// SECRET SMOOBU
//var SMOOBU_URL = process.env.SMOOBU_URL;
//var USER_KEY = process.env.USER_KEY;
// SECRET TILEDESK
var TILEDESK_API_KEY = process.env.TILEDESK_API_KEY;
var TILEDESK_API_VER = process.env.TILEDESK_API_VER;
var DOMAIN = process.env.DOMAIN;
//var BOOKING_API = process.env.BOOKING_API;
//console.log('BOOKING_API:', BOOKING_API);
// DATABASE KVBASE
const max = 100000;
const { KVBase } = require('./KVBase');
let db = new KVBase();
let orderId;

//-------------------------------------------------------------------------------------------------------------
// ATTENTO SOLO PER TEST
//var stripe_publishable_key = process.env.STRIPE_PUBLISHABLE_KEY;
//var stripe_wehook_secret = process.env.STRIPE_WEBHOOK_SECRET;
//var stripe_secret_key = process.env.STRIPE_SECRET_KEY;
//var settings = { stripe_publishable_key: stripe_publishable_key, stripe_wehook_secret: stripe_wehook_secret, stripe_secret_key: stripe_secret_key };

//-------------------------------------------------------------------------------------------------------------





// IMPORT TILEDESK
const { TiledeskChatbotClient } = require('@tiledesk/tiledesk-chatbot-client');
const { TiledeskClient } = require('@tiledesk/tiledesk-client');

// import node-fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) =>
  fetch(...args));
// FS
const fs = require('fs');
//Handlbars
const handlebars = require('handlebars');

let orders_status = {
  "123": "DELIVERING"
}

// TEST FUNCTION
router.get('/', async (req, res) => {
  console.log(req.baseUrl)
  res.send('Hello Booking Chatbot Server!');
});

// -----------------------------------------------------------------------
// CONFIGURATION PAYMENT 
//------------------------------------------------------------------------
router.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function(req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

// READ THE CONFIGURATION THE APP
router.get('/getconfigure', async (req, res) => {
  console.log('/getconfigure - READ APP Stripe Configure');
  //console.log('Request query: ', req.query);
  var projectId = req.query.projectId;
  var sett = await db.get(projectId);
  console.log('/getconfigure - APP Config project_id ', projectId);
  //var sett = await db.get(projectId);
  console.log('/getconfigure - APP Config sett ', sett);
  var stripe_publishable_key = sett.stripe_publishable_key;
  var stripe_wehook_secret = sett.stripe_wehook_secret;
  var stripe_secret_key = sett.stripe_secret_key;
  var booking_userkey = sett.booking_userkey;
  var booking_sistem_integration_api = sett.booking_sistem_integration_api
  var log = false;
  var page = '/setting.html';
  var dir = '/setting';
  readHTMLFile(page, dir, (err, html) => {
    if (err) {
      console.log("/getconfigure - (ERROR) Read html file: ", err);
    }
    var template = handlebars.compile(html);
    var replacements = {
      //pay_method_types: pay_method_types,
      stripe_publishable_key: sett.stripe_publishable_key,
      stripe_wehook_secret: sett.stripe_wehook_secret,
      stripe_secret_key: sett.stripe_secret_key,
      booking_userkey: booking_userkey,
      booking_sistem_integration_api: booking_sistem_integration_api
    }
    if (log) {
      console.log("/getconfigure - Replacements: ", replacements);
    }
    var html = template(replacements);
    res.send(html);
  })
})
// INIZIALIZE A BOOKING CONFIGURATION
router.get('/setting', async (req, res) => {
  var page = '';
  var dir = '';
  //READ THE CONFIGURATION FILE
  //console.log('req START ', req);
  console.log('/SETTING - req project_id ', req.query.project_id);

  var projectId = req.query.project_id;
  var change = 'no';
  if (req.query.change != 'undefined') {
    change = req.query.change;
  }
  console.log('/SETTING - change', change);
  var sett = await db.get(projectId);
  console.log('/SETTING - Read settings APP', sett);
  var stripe_publishable_key;
  var stripe_wehook_secret;
  var stripe_secret_key;
  var booking_sistem_integration_api;
  var booking_userkey;
  var booking_api_url;
  var customerid;

  // ATTENTO TEST
  sett.booking_sistem_integration_api = process.env.BOOKING_API;

  stripe_publishable_key = sett.stripe_publishable_key;
  stripe_wehook_secret = sett.stripe_wehook_secret;
  stripe_secret_key = sett.stripe_secret_key;
  booking_userkey = sett.booking_userkey;
  booking_sistem_integration_api = sett.booking_sistem_integration_api;
  booking_api_url = sett.booking_api_url;
  customerid = sett.customerid;
  console.log('BOOKING_API:', booking_sistem_integration_api);

  var booking_userkey;
  if (change === "yes") {
    //CHANGE  SETTINGS
    console.log('/PAYMENT - CHANGE SETTINGS!');
    var log = false;
    page = '/setting.html';
    dir = '/setting';
    readHTMLFile(page, dir, (err, html) => {
      if (err) {
        console.log("/PAYMENT - (ERROR) Read html file: ", err);
      }
      var template = handlebars.compile(html);
      var replacements = {
        stripe_publishable_key: stripe_publishable_key,
        stripe_secret_key: stripe_secret_key,
        stripe_wehook_secret: stripe_wehook_secret,
        booking_userkey: booking_userkey,
        booking_sistem_integration_api: booking_sistem_integration_api,
        booking_api_url: booking_api_url,
        customerid: customerid
      }
      if (log) {
        console.log("/PAYMENT - Replacements: ", replacements);
      }
      var html = template(replacements);
      res.send(html);
    })
  } else {
    if (sett != null && sett.stripe_publishable_key != null && sett.stripe_secret_key != null && sett.stripe_secret_key != null && sett.booking_sistem_integration_api != null && sett.booking_userkey != null && sett.booking_sistem_integration_api != null) {
      // SETTINGS IS OK!
      console.log('/PAYMENT - SETTINGS IS OK!');
      var log = false;
      page = '/reading.html';
      dir = '/setting';
      readHTMLFile(page, dir, (err, html) => {
        if (err) {
          console.log("/PAYMENT - (ERROR) Read html file: ", err);
        }
        var template = handlebars.compile(html);
        var replacements = {
          //pay_method_types: pay_method_types,
          stripe_publishable_key: stripe_publishable_key,
          stripe_secret_key: stripe_secret_key,
          stripe_wehook_secret: stripe_wehook_secret,
          booking_userkey: booking_userkey,
          booking_sistem_integration_api: booking_sistem_integration_api,
          booking_api_url: booking_api_url,
          customerid: customerid
        }
        if (log) {
          console.log("/PAYMENT - Replacements: ", replacements);
        }
        var html = template(replacements);
        res.send(html);
      })
    } else {
      console.log('/PAYMENT - SETTINGS IS KO!');
      var log = false;
      page = '/setting.html';
      dir = '/setting';
      readHTMLFile(page, dir, (err, html) => {
        if (err) {
          console.log("/PAYMENT - (ERROR) Read html file: ", err);
        }
        var template = handlebars.compile(html);
        var replacements = {
          stripe_publishable_key: stripe_publishable_key,
          stripe_secret_key: stripe_secret_key,
          stripe_wehook_secret: stripe_wehook_secret,
          booking_userkey: booking_userkey,
          booking_sistem_integration_api: booking_sistem_integration_api,
          booking_api_url: booking_api_url

        }
        if (log) {
          console.log("/PAYMENT - Replacements: ", replacements);
        }
        var html = template(replacements);
        res.send(html);
      })
    }

  }
});
// SET CONFIGURATION STRIPE AND SMOOBY THE APP
router.post('/configure', async (req, res) => {
  console.log('/configure - Write APP Stripe Configure');
  console.log('Request query: ', req.body);
  var projectId = req.body.projectId;
  var stripe_publishable_key = req.body.stripe_publishable_key;
  var stripe_wehook_secret = req.body.stripe_wehook_secret;
  var stripe_secret_key = req.body.stripe_secret_key;
  var booking_userkey = req.body.booking_userkey;
  var booking_sistem_integration_api = req.body.booking_sistem_integration_api;
  var booking_api_url = req.body.booking_api_url;
  var customerid = req.body.customerid;
  console.log('/configure -  APP Config project_id ', projectId);
  //console.log('/configure -  APP Config stripe_publishable_key ', stripe_publishable_key);
  //console.log('/configure -  APP Config stripe_wehook_secret', stripe_wehook_secret);
  //console.log('/configure -  APP Config stripe_secret_key', stripe_secret_key);
  var log = true;
  // Retrieve the event by verifying the signature using the raw body and secret.
  if (stripe_publishable_key != 'undefined' && stripe_wehook_secret != 'undefined' && stripe_secret_key != 'undefined' && booking_userkey != 'undefined' && customerid != 'undefined' && booking_sistem_integration_api != 'undefined' && booking_api_url != 'undefined' & stripe_publishable_key != null && stripe_wehook_secret != null && stripe_secret_key != null && booking_userkey != null && booking_sistem_integration_api != null && booking_api_url != null && customerid != null) {
    // SETTINGS THE APP STRIPE!
    var settings = { stripe_publishable_key: stripe_publishable_key, stripe_wehook_secret: stripe_wehook_secret, stripe_secret_key: stripe_secret_key, booking_userkey: booking_userkey, booking_sistem_integration_api: booking_sistem_integration_api, booking_api_url: booking_api_url, customerid: customerid };
    try {
      await db.set(projectId, settings);
      console.log('/configure - Sett settings APP!', settings);
      res.status(200).send({ success: true });
    } catch (error) {
      console.error(error);
      res.status(400).send(error);
    }
  } else {
    res.status(400).send('parameter required not present');
  }
});

// CONFIGURE STRIPE
//RETURN THE CONFIG KEY IN MULTITENANT
router.get('/config', async (req, res) => {
  const projectId = req.query.projectId;
  console.log('/CONFIG - projectId: ', projectId);
  var sett = await db.get(projectId);
  // ATTENTO SOLO PER TEST
  //var sett = settings;
  console.log('/CONFIG - Read settings APP', sett);
  if (sett != null) {
    res.send({
      publishableKey: sett.stripe_publishable_key,
    });
  } else {
    res.send({
      publishableKey: 0,
    });
  }
});

//CONTROLL IF THE PAYMENT IS PAID
router.get('/payment-control', async (req, res) => {
  const orderId = req.query.orderId;
  console.log('/payment-control -  orderId:', orderId);
  if (orderId != null && orderId != 'undefined') {
    var resu = await db.get(orderId);
    console.log('/payment-control - resu: ', resu);
    if (resu) {
      return res.send({
        paid: resu.paid,
      });
    }
  }
});
//RETURN THE CLIENTSECRET KEY IN MULTITENANT
router.get('/clientSecret', async (req, res) => {
  const orderId = req.query.orderId;
  console.log('/CONFIG - orderId: ', orderId);
  var resu = await db.get(orderId);
  console.log('/clientSecret - resu: ', resu);
  if (resu) {
    return res.send({
      clientSecret: resu.clientSecret,
    });
  }
});
// END CONFIGURATION PAYMENT

//--------------------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------------------
//  CONTROLLER API METHOD
//--------------------------------------------------------------------------------------------------------------------------

// READ THE INFO
// src: DOMAIN + '/bcserver/bblist' + '/?arrival_date=' + arrival_date + '&departure_date=' + departure_date + '&customerid=' + customerid + '&project_id=' + project_id + '&token=' + token + '&number_people=' + number_people,
router.get('/bblist', async (req, res) => {
  console.log('/BBLIST - SHOW THE APARTMENT LIST');
  console.log('Request query: ', req.query);
  var projectId = req.query.project_id;
  var token = req.query.token;
  var arrival_date = req.query.arrival_date;
  var departure_date = req.query.departure_date;
  var customerid = req.query.customerid;
  var number_people = parseInt(req.query.number_people);
  var request_id = req.query.request_id;
  console.log('/bblist/request_id :', request_id);
  // CALL THE AVALILABILTY SERVICE
  let bodydata = {
    arrivalDate: arrival_date,
    departureDate: departure_date,
    apartments: [],
    customerId: customerid,
    guests: number_people
  };
  var sett = await db.get(projectId);
  console.log('/payment/created/SETTINGS', sett);
  const smoobuClient = new smoobuService({ APPS_API_URL: sett.booking_api_url, USER_KEY: sett.booking_userkey });
  let availabilityData = await smoobuClient.getAvailability(bodydata);
  console.log('Availability search :', availabilityData);
  // IF APPARTMENT
  if (availabilityData) {
    // CREARE ARRAY DEGLI APPARTAMENTI
    var availability = [];
    for (var i in availabilityData.availableApartments) {
      var item = availabilityData
      //console.log('userData.availableApartments[i]', item);

      // CALL getAppartmentInfo Service for return APPARTMENT INFO 
      // GET APPARTMENT INFO 
      let bodydata = {
        apartmentId: item.availableApartments[i]
      };
      let appartmentDataApp = await smoobuClient.getAppartmentInfo(bodydata);
      console.log('bcserver/getApartmentInfo/availabilityData', appartmentDataApp);
      if (appartmentDataApp) {
        console.log('appartmentDataApp', appartmentDataApp.name);
      }
      // --------------------------------------------------------------------------------------------
      // --- ARRAY PRICE FOR TEST ATTENTO ONLY FOR TEST
      const price = [200, 150, 100];

      availability.push({
        "id": item.availableApartments[i],
        "name": appartmentDataApp.name,
        // ATTENTO DA MODIFICARE IM PRO -- SOLO TEST
        //"price": item.prices[item.availableApartments[i]].price,
        // --------------------------------------------------------------------------------------------
        "price": price[i],
        "currency": appartmentDataApp.currency,
        "maxOccupancy": appartmentDataApp.rooms.maxOccupancy,
      });
    }
    console.log('availability', availability);
    console.log('availability length', availability.length);
    // 

    //console.log('userData.prices', userData.prices[1818575]);
    //console.log('userData.prices', userData.prices[1818575].price);

    // HANDLEBARS
    var log = false;
    var page = '/bblist.html';
    var dir = '/template';
    readHTMLFile(page, dir, (err, html) => {
      if (err) {
        console.log("/INFO - (ERROR) Read html file: ", err);
      }
      var template = handlebars.compile(html);
      var replacements = {
        number_properties: availability.length,
        apps: availability,
        token: token,
        projectId: projectId,
        arrivalDate: arrival_date,
        departureDate: departure_date,
        number_people: number_people,
        request_id: request_id,
      }
      if (log) {
        console.log("/INFO - Replacements: ", replacements);
      }
      var html = template(replacements);
      res.send(html);
    })
  }// END IF
});

//INSERT THE GUEST INFO AND CREATE RESERVATION
router.get('/guest', async (req, res) => {
  console.log('/GUEST - INSERT THE GUEST INFO');
  console.log('Request query: ', req.query);
  var projectId = req.query.project_id;
  var token = req.query.token;
  // CHECK DATA
  var arrival_date = req.query.arrival_date;
  var departure_date = req.query.departure_date;
  var number_people = req.query.number_people;
  //var customerid = req.query.customerid;
  var number_people = req.query.number_people;
  // PRORIETY SELECTED
  var name_propriety = req.query.name_propriety;
  var total_propriety = req.query.total_propriety;
  var currency_propriety = req.query.currency_propriety;
  var max_occ_propriety = req.query.max_occ_propriety;
  var request_id = req.query.request_id;
  var propriety_id = req.query.propriety_id;


  var log = false;
  var page = '/guest.html';
  var dir = '/template';
  // IF DATA APPARTMENT
  if (projectId) {
    readHTMLFile(page, dir, (err, html) => {
      if (err) {
        console.log("/GUEST - (ERROR) Read html file: ", err);
      }
      var template = handlebars.compile(html);
      var replacements = {
        token: token,
        projectId: projectId,
        arrivalDate: arrival_date,
        departureDate: departure_date,
        number_people: number_people,
        name_propriety: name_propriety,
        total_propriety: total_propriety,
        currency_propriety: currency_propriety,
        max_occ_propriety: max_occ_propriety,
        request_id: request_id,
        propriety_id: propriety_id,
      }
      if (log) {
        console.log("/INFO - Replacements: ", replacements);
      }
      var html = template(replacements);
      res.send(html);
    })
  }// END IF
  else {
    readHTMLFile(page, dir, (err, html) => {
      if (err) {
        console.log("/GUEST - (ERROR) Read html file: ", err);
      }
      var template = handlebars.compile(html);
      var replacements = {
      }
      if (log) {
        console.log("/INFO - Replacements: ", replacements);
      }
      var html = template(replacements);
      res.send(html);
    })
  }
});

//INSERT THE GUEST INFO AND CREATE RESERVATION
router.get('/booking/created', async (req, res) => {
  console.log('/GUEST - INSERT THE GUEST INFO');
  console.log('Request query: ', req.query);
  var projectId = req.query.project_id;
  var token = req.query.token;
  // CHECK DATA
  var arrival_date = req.query.arrivaldate;
  var departure_date = req.query.departuredate;
  var number_people = req.query.number_people;
  //var customerid = req.query.customerid;
  // PRORIETY SELECTED
  var name_propriety = req.query.name_propriety;
  var total_propriety = req.query.total_propriety;
  var currency_propriety = req.query.currency_propriety;
  var max_occ_propriety = req.query.max_occ_propriety;
  var request_id = req.query.request_id;
  var propriety_id = req.query.propriety_id;
  // GUEST
  var firstname = req.query.firstname;
  var lastname = req.query.lastname;
  var email = req.query.email;
  var description = req.query.description;
  // BOOK THE PROPRIETY
  const url = DOMAIN + '/bcserver/createReservation';
  const customHeaders = {
    "Content-Type": "application/json",
  }
  let bodydata = {
    arrivalDate: arrival_date,
    departureDate: departure_date,
    apartmentId: JSON.parse(propriety_id),
    firstName: firstname,
    lastName: lastname,
    email: email,
    projectId: projectId
  };
  try {
    const apiResponse = await fetch(url, {
      method: "POST",
      headers: customHeaders,
      body: JSON.stringify(bodydata),
    }).then(res => res.json())
      .catch(error => console.warn(error));


    //const body = await res.text();
    //console.log(body);
    console.log('/payment/created/BOOKING respose:', apiResponse);
    console.log('/payment/created/BOOKING respose obj:', apiResponse.id);
    if (apiResponse.id != undefined) {
      var log = false;
      var page = '/pay.html';
      var dir = '/template';
      // IF DATA APPARTMENT
      if (projectId) {
        readHTMLFile(page, dir, (err, html) => {
          if (err) {
            console.log("/GUEST - (ERROR) Read html file: ", err);
          }
          var template = handlebars.compile(html);
          var replacements = {
            token: token,
            projectId: projectId,
            arrivalDate: arrival_date,
            departureDate: departure_date,
            number_people: number_people,
            name_propriety: name_propriety,
            total_propriety: total_propriety,
            currency_propriety: currency_propriety,
            max_occ_propriety: max_occ_propriety,
            request_id: request_id,
            propriety_id: propriety_id,
            firstname: firstname,
            lastname: lastname,
            email: email,
            booking_code: apiResponse.id,
            description: description,
            reservationsid: apiResponse.id,
          }
          if (log) {
            console.log("/INFO - Replacements: ", replacements);
          }
          var html = template(replacements);
          res.send(html);
        })
      }// END IF
      else {
        readHTMLFile(page, dir, (err, html) => {
          if (err) {
            console.log("/GUEST - (ERROR) Read html file: ", err);
          }
          var template = handlebars.compile(html);
          var replacements = {
          }
          if (log) {
            console.log("/INFO - Replacements: ", replacements);
          }
          var html = template(replacements);
          res.send(html);
        })
      }
    }
  } catch (error) {
    console.error(error);
  }




  // END BOOK THE PROPRIETY

});

//DELETE THE RESERVATION
router.get('/booking/delete/:reservationId', async (req, res) => {
  console.log('/DELETE BOOKING');
  console.log('Request query: ', req.query);
  var projectId = req.query.projectid;
  var token = req.query.token;
  var request_id = req.query.request_id;
  let reservationId = req.params.reservationId;
  console.log('/DELETE BOOKING/reservationId: ', reservationId);

  // BOOK THE PROPRIETY
  const url = DOMAIN + '/bcserver/getReservationInfo/' + reservationId + '/?projectid=' + projectId;
  const customHeaders = {
    "Content-Type": "application/json",
  }
  console.log('/DELETE BOOKING/url: ', url);
  try {
    const apiResponse = await fetch(url, {
      method: "GET",
      headers: customHeaders,
    }).then(res => res.json())
      .catch(error => console.warn(error));

    console.log('/DELETE BOOKING/respose:', apiResponse);
    if (apiResponse != undefined) {
      console.log('/payment/created - orderId - delete', apiResponse.id);
      const resu = await db.get(apiResponse.id);
      console.log('/payment/created - post-result - delete', resu);
      var log = false;
      var page = '/delete.html';
      var dir = '/template';
      // IF DATA APPARTMENT
      if (projectId && resu) {
        readHTMLFile(page, dir, (err, html) => {
          if (err) {
            console.log("/GUEST - (ERROR) Read html file: ", err);
          }
          var template = handlebars.compile(html);
          var replacements = {
            token: token,
            projectId: projectId,
            arrivalDate: apiResponse.arrival,
            departureDate: apiResponse.departure,
            //number_people: number_people,
            name_propriety: apiResponse.apartment.name,
            request_id: request_id,
            firstname: apiResponse.firstname,
            lastname: apiResponse.lastname,
            email: apiResponse.email,
            booking_code: apiResponse.id,
            total_propriety: resu.amount,
            currency_propriety: resu.currency,
          }
          if (log) {
            console.log("/INFO - Replacements: ", replacements);
          }
          //writeButton(projectId, token, request_id);
          var html = template(replacements);
          res.send(html);
        })
      }// END IF
      else {
        readHTMLFile(page, dir, (err, html) => {
          if (err) {
            console.log("/GUEST - (ERROR) Read html file: ", err);
          }
          var template = handlebars.compile(html);
          var replacements = {
            error: 'The reservation number entered was not found!'
          }
          if (log) {
            console.log("/INFO - Replacements: ", replacements);
          }
          //writeButton(projectId, token, request_id);
          var html = template(replacements);
          res.send(html);
        })
      }
    }
  } catch (error) {
    console.error(error);
  }




  // END BOOK THE PROPRIETY

});


//INSERT THE GUEST INFO AND CREATE RESERVATION
router.post('/payment/created', async (req, res) => {
  console.log('/PAY - CREATE THE PAYMENT');
  let messageid = "";
  const token = req.body.token
  let amount = req.body.amount
  let currency = req.body.currencyList
  const projectId = req.body.projectId;
  const request_id = req.body.request_id;
  const description = req.body.description;
  const customer_mail = req.body.customer_mail;
  const customer_name = req.body.customer_name;
  const reservationsid = req.body.reservationsid;

  //generate random orderId
  //orderId = projectId + Math.floor(Math.random() * max).toString();
  if (reservationsid != null && reservationsid != 'undefined') {
    orderId = reservationsid;
  } else {
    //orderId = projectId + Math.floor(Math.random() * max).toString();
  }
  console.log('/payment/created - reservationsid: ', orderId);
  //CONTROL IF THE ORDERID exists FOR THE MULTITENANT USE
  let orderIdOld = await db.get(orderId);
  console.log('/payment/created - orderIdOld: ', orderIdOld);
  if (orderIdOld != null || orderIdOld != 'undefined') {
    //orderId = Math.floor(Math.random() * max);
    //orderId = projectId + Math.floor(Math.random() * max).toString();
  }
  console.log('/payment/created - post-amount: ', amount);
  console.log('/payment/created - post-currencyList: ', currency);
  console.log('/payment/created - post-description: ', description);
  console.log('/payment/created - post-projectId: ', projectId);
  console.log('/payment/created - token: ', token);
  console.log('/payment/created - orderId: ', orderId);
  console.log('/payment/created - customer_mail: ', customer_mail);
  console.log('/payment/created - customer_name: ', customer_name);
  console.log('/payment/created - projectId: ', projectId);
  console.log('/payment/created - request_id: ', request_id);
  console.log('/payment/created - reservationsid: ', reservationsid);
  // CONFIGURATION PARAMETER
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // ATTENTO SOLO PER TEST
  //var customerId = 'cus_NWffceA5XJAKNE';
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  const tdclient = new TiledeskClient(
    {
      APIKEY: TILEDESK_API_KEY,
      projectId: projectId,
      //token: resu.token
      token: token,
      APIURL: TILEDESK_API_VER
    })

  var sett = await db.get(projectId);
  console.log('/payment/created/SETTINGS', sett);
  const stripe = require('stripe')(sett.stripe_secret_key, {
    apiVersion: '2020-08-27',
    appInfo: { // For sample support and debugging, not required for production:
      name: "https://booking-server.leomirco.repl.co",
      version: "0.1.0",
      url: "https://github.com/Tiledesk/tiledesk-stripe-accept-a-payment.git"
    }
  });
  // ---------------------------------------------------------------
  // CONTROLL IF CUSTOMER EXIST
  //----------------------------------------------------------------
  // ATTENTION NOT FOR MULTITENANT WITH THE SAME CUSTOMER MAIL
  // IF a NEW MAIL THEN CREATE A NEW CUSTOMER
  // create the user if it doesn't exist
  let customerId;
  let customer = await db.get(customer_mail);
  if (customer == null && customer_mail != null && projectId != null && token != null && tdclient != null) {
    console.log('/created - customer NOT EXIST');
    try {
      customer = await stripe.customers.create({
        name: customer_name,
        email: customer_mail,
      });
      console.log('/created - New customerId create: ', customer);
      await db.set(customer_mail, customer);
      customerId = customer.id;
    } catch (error) {
      console.error('STRIPE ERROR NEW CUSTOMER', error.toString().slice(0, 50));
      // SEND ERROR TO THE CHAT
      tdclient.sendSupportMessage(
        request_id,
        //resu.request_id,
        { text: '⚠️  Stripe error new customer: ' + error.toString().slice(0, 50) },
        (err, result) => {
          assert(err === null);
          assert(result != null);
        });
      return res.sendStatus(400);
    }
  } else {
    console.log('/created - Old customerId', customer.id);
    customerId = customer.id;
  }



  // ---------------------------------------------------------------
  // CREATE THE PAYMENT ON STRIPE
  //----------------------------------------------------------------
  if (stripe != null && currency != null && amount != null && customerId != null && customer_mail != null && orderId != null && projectId != null && token != null) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        currency: currency,
        amount: (amount * 100),
        customer: customerId,
        description: description,
        payment_method_types: ['card'],
        receipt_email: customer_mail,
        metadata: { order_id: orderId },
        shipping: {
          address: {
            city: "a",
            line1: "b",
            line2: "c",
            postal_code: "1",
            state: "d"
          },
          name: customer_name
        }
      });
      console.log('/payment/created - PAYMENT CREATED!', paymentIntent);
      // Send publishable key and PaymentIntent details to client
      if (paymentIntent.client_secret != null && paymentIntent != null) {
        // SEND MSG FOR PAY
        // create a TiledeskClient instance
        const tdclient = new TiledeskClient(
          {
            APIKEY: TILEDESK_API_KEY,
            projectId: projectId,
            token: token,
            APIURL: TILEDESK_API_VER
          })
        var message = {
          type: "frame",
          text: 'Pay: ' + currency + " " + amount,
          metadata: {
            //src: DOMAIN + '/?clientSecret=' + clientSecret + '&projectId=' + projectId + '&orderId=' + orderId,
            src: DOMAIN + '/?projectId=' + projectId + '&orderId=' + orderId,
            width: '100%',
            height: '330px'
          }
        }
        console.log('/payment/created - post request_id: ', request_id);
        var payment = { orderId: orderId, projectId: projectId, request_id: request_id, currency: currency, amount: amount, description: description, messageid: '', token: token, customer_mail: customer_mail, customer_name: customer_name, paid: false, created: 0, paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret };
        await db.set(orderId, payment);
        tdclient.sendSupportMessage(
          request_id,
          message, async (err, result) => {
            if (err) {
              return res.status(500).send({ error: err });
            }
            console.log('/payment/created - post-result._id', result._id);
            messageid = result._id;
            // Read the old orderId
            //save your app's status in the key-value store as "completed"
            var payment = { orderId: orderId, projectId: projectId, request_id: request_id, currency: currency, amount: amount, description: description, messageid: messageid, token: token, customer_mail: customer_mail, customer_name: customer_name, paid: false, created: 0, paymentIntentId: paymentIntent.idl, clientSecret: paymentIntent.client_secret };
            await db.set(orderId, payment);
            console.log('/payment/created - post-orderId', orderId);
            const resu = await db.get(orderId)
            console.log('/payment/created - post-result', resu);
          });
        res.send('Payment created!');
      } else {
        res.send('Payment error!');
      }
    } catch (e) {
      console.error('STRIPE ERROR PAYMENT INTENT 1:', e);
      tdclient.sendSupportMessage(
        request_id,
        { text: '⚠️  Stripe error Pay Intent: ' + e.toString().slice(0, 50) },
        (e, result) => {
          assert(e === null);
          assert(result != null);
        });
      return res.status(400).send({
        error: {
          message: e.message,
        },
      });
    }
  }
});

// END CONTROLLER API METHOD

//--------------------------------------------------------------------------------------------------------------------------
// START WEBHOOK
//--------------------------------------------------------------------------------------------------------------------------


// CREATE PAYMENT E PAY SUCCCESS WEBHOOK
// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard
router.post('/webhook', async (req, res) => {
  let data, eventType;
  if (req === null) {
    res.sendStatus(204);
  }
  else {
    data = req.body.data;
    console.log('/WEBHOOK - OrderID 0: ', data.object.metadata.order_id);
    let orderid = data.object.metadata.order_id;
    let customerid = data.object.customer;
    var resu = 0;
    if (orderid != null && orderid != 'undefined') {
      resu = await db.get(orderid);
      console.log('/WEBHOOK - result 0: ', resu);
      // Check if webhook signing is configured.
      if (resu != null && resu.projectId != null && resu.projectId != 'undefined') {
        var sett = await db.get(resu.projectId);
        console.log('/WEBHOOK APP Config sett 0: ', sett);
        var stripe_publishable_key = sett.stripe_publishable_key;
        var stripe_wehook_secret = sett.stripe_wehook_secret;
        var stripe_secret_key = sett.stripe_secret_key;
        var booking_userkey = req.body.booking_userkey;
        var booking_sistem_integration_api = req.body.booking_sistem_integration_api;
        //}
        //}

        if (stripe_publishable_key != 'undefined' && stripe_publishable_key != null && stripe_wehook_secret != 'undefined' && booking_userkey != 'undefined' && booking_sistem_integration_api != 'undefined' && stripe_wehook_secret != null && stripe_secret_key != null && stripe_secret_key != 'undefined' && booking_userkey != null && booking_sistem_integration_api != null) {
          console.log('/WEBHOOK - STRIPE_WEBHOOK_SECRET 0: ', stripe_wehook_secret);
          console.log('/WEBHOOK - stripe_publishable_key 0: ', stripe_publishable_key);
          console.log('/WEBHOOK - stripe_secret_key 0: ', stripe_secret_key);
          console.log('/WEBHOOK - booking_userkey 0: ', booking_userkey);
          console.log('/WEBHOOK - booking_sistem_integration_api 0: ', booking_sistem_integration_api);
          // Retrieve the event by verifying the signature using the raw body and secret.
          let event;
          let signature = req.headers['stripe-signature'];
          console.log('/WEBHOOK - stripe-signature 0: ', signature)
          //DEFINE STRIPE CONST
          const stripe = require('stripe')(stripe_secret_key, {
            apiVersion: '2020-08-27',
            appInfo: { // For sample support and debugging, not required for production:
              name: "stripe-samples/accept-a-payment/payment-element",
              version: "0.0.2",
              url: "https://github.com/stripe-samples"
            }
          });
          console.log('/WEBHOOK - req.rawBody 0: ', req.rawBody);
          try {
            event = stripe.webhooks.constructEvent(
              req.rawBody,
              signature,
              stripe_wehook_secret
            );
          } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`, err);
            //return res.sendStatus(400);
            // RETURN THE CONFIGURATION ERROR ON THE CHAT
            const tdclient = new TiledeskClient(
              {
                APIKEY: TILEDESK_API_KEY,
                projectId: resu.projectId,
                token: resu.token,
                APIURL: TILEDESK_API_VER
              })

            tdclient.sendSupportMessage(
              resu.request_id,
              { text: '⚠️  No publishable key returned from the server or Webhook signature verification failed. Please configure the App and try again! ' },
              (err, result) => {
                assert(err === null);
                assert(result != null);
              });
            return res.sendStatus(400);
          }
          data = event.data;
          eventType = event.type;
        } else {
          // Webhook signing is recommended, but if the secret is not configured in `config.js`,
          // we can retrieve the event data directly from the request body.
          data = req.body.data;
          eventType = req.body.type;
        }
        console.log('/WEBHOOK - Webhook Data', data);
        console.log('/WEBHOOK - Webhook Type', eventType);

        if (eventType === 'payment_intent.succeeded') {
          // Funds have been captured
          // Fulfill any orders, e-mail receipts, etc
          // To cancel the payment after capture you will need to issue a Refund 
          console.log('💰 Payment captured!');
          var resu = 0;
          if (orderid != null && orderid != 'undefined') {
            resu = await db.get(orderid);
            console.log('/payment/succeeded - post-result', resu);
          }
          // CLOSE THE PAYMENT ON  DB
          if (resu != null && resu != 'undefined') {
            var payment = { orderId: resu.orderId, projectId: resu.projectId, request_id: resu.request_id, currency: resu.currency, amount: resu.amount, description: resu.description, messageid: resu.messageid, token: resu.token, customer_mail: resu.customer_mail, customer_name: resu.customer_name, paid: true, clientSecret: resu.clientSecret };
            await db.set(orderid, payment);
          }
          console.log('/payment/succeeded - End-Payment', payment);

          // SEND THE MSG PAY CORRECT ON THE CHAT
          let messageid = "";
          const tdclient = new TiledeskClient(
            {
              APIKEY: TILEDESK_API_KEY,
              projectId: resu.projectId,
              token: resu.token,
              APIURL: TILEDESK_API_VER
            })
          if (resu != null && resu != 'undefined') {
            tdclient.sendSupportMessage(
              resu.request_id,
              { text: 'Payment of ' + resu.amount + ' ' + resu.currency + ' completed successfully. Thank you!' },
              (err, result) => {
                assert(err === null);
                assert(result != null);
              });
            //res.send('Payment successful!')
            //writeButton(resu.projectId, resu.token, resu.request_id);
          } else {
            //res.send('Payment wrong!')
          }
        } else if (eventType === 'payment_intent.payment_failed') {
          console.log('❌ Payment failed.');
          // SEND THE MSG PAY FAILLED ON THE CHAT
          // Read the payment data
          var resu = 0;
          if (orderid != null && orderid != 'undefined') {
            resu = await db.get(orderid);
            console.log('/WEBHOOK - result payment_failed', resu);
          }
          let messageid = "";
          const tdclient = new TiledeskClient(
            {
              APIKEY: TILEDESK_API_KEY,
              projectId: resu.projectId,
              token: resu.token,
              APIURL: TILEDESK_API_VER
            })
          if (resu != null && resu != 'undefined') {
            tdclient.sendSupportMessage(
              resu.request_id,
              { text: 'Payment of ' + resu.amount + ' ' + resu.currency + ' failed! Please try again.' },
              (err, result) => {
                assert(err === null);
                assert(result != null);
              });
            writeButton(resu.projectId, resu.token, resu.request_id);
          }
          //----------------------------------------------------------
        } else if (eventType === 'payment_intent.created') {
          console.log('🆕 Payment created.');
          // Then define and call a function to handle the event payment_intent.createdß
          // SEND THE MSG PAY CREATED ON THE CHAT
          // Read the payment data
          //console.log('Payment created OrderID 2: ', data.object.metadata.order_id);
          //console.log('Payment created CustomerID 2: ', data.object.customer);
          //let orderid = data.object.metadata.order_id;
          //let customerid = data.object.customer;
          var resu = 0;
          if (orderid != null && orderid != 'undefined') {
            resu = await db.get(orderid);
            console.log('/WEBHOOK - result payment created 1', resu);
          }
          let messageid = "";
          const tdclient = new TiledeskClient(
            {
              APIKEY: TILEDESK_API_KEY,
              projectId: resu.projectId,
              token: resu.token,
              APIURL: TILEDESK_API_VER
            })
          if (resu.created == 0) {
            if (resu != null && resu != 'undefined') {
              tdclient.sendSupportMessage(
                resu.request_id,
                { text: 'Payment created! Please complete your payment.' },
                (err, result) => {
                  assert(err === null);
                  assert(result != null);
                });
            }
          }
        }
        res.sendStatus(200);
      }
    } else {
      res.sendStatus(204);
    }
  }
});

//--------------------------------------------------------------------------------------------------------------------------
// START SMOOBU (INTEGRATION) API
//--------------------------------------------------------------------------------------------------------------------------

// GET USER
// https://booking-server.leomirco.repl.co/bcserver/getUser
router.get('/getUser', async (req, res) => {
  console.log("bcserver/getUser/user_key", USER_KEY);
  try {
    //var userKey = 'rDrR1eOnRuibLF0hJcrNBzHBrN9krRidZLKy9KVtc8'
    var sett = await db.get(projectId);
    console.log('/payment/created/SETTINGS', sett);
    const smoobuClient = new smoobuService({ APPS_API_URL: sett.booking_api_url, USER_KEY: sett.booking_userkey });
    let userData = await smoobuClient.getUser();
    if (userData) {
      res.send(userData);
    } else {
      return res.status(400).send({ success: false, msg: 'Error getting user.' });
    }
  }
  catch (err) {
    console.error('GET availability ERROR ', err);
    return res.status(500).send({ success: false, msg: 'Error getting user.' });
  }

});

// TEST FUNCTION CHECK APARTMENT AVAILABILITY
//    "arrivalDate" : "2023-08-08",
//    "departureDate":  "2023-08-10",
//    "apartments": [1818704],
//    "customerId": 660362
// https://booking-server.leomirco.repl.co/bcserver/getAvailability?arrivaldate=2023-08-08&departuredate=2023-08-10&apartments=1818704&customerId=660362
router.get('/getAvailability', async (req, res) => {
  let arrivalDate = req.query.arrivaldate;
  let departureDate = req.query.departuredate;
  let apartments = req.query.apartments;
  let customerId = req.query.customerId;
  console.log("bcserver/getAvailability/user_key", USER_KEY);
  let availabilitys = [];

  var sett = await db.get(projectId);
  console.log("bcserver/createReservation/sett", sett);
  let booking_api = sett.booking_sistem_integration_api;
  // IF CONNECT WITH SMOOBU API
  if (booking_api === "smoobu") {
    try {
      let bodydata = {
        arrivalDate: arrivalDate,
        departureDate: departureDate,
        apartments: [], //apartments: [apartments],
        customerId: customerId
      };
      var sett = await db.get(projectId);
      console.log('/payment/created/SETTINGS', sett);
      const smoobuClient = new smoobuService({ APPS_API_URL: sett.booking_api_url, USER_KEY: sett.booking_userkey });
      let userData = await smoobuClient.getAvailability(bodydata);
      if (userData) {
        res.send(userData);
      } else {
        return res.status(400).send({ success: false, msg: 'Error getting Availability.' });
      }
    }
    catch (err) {
      console.error('GET availability ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error getting availabilitys.' });
    }
  }
});

// TEST FUNCTION CREATE BOOKING
// "arrivalDate": "2023-08-14",
//  "departureDate": "2023-08-22",
//  "apartmentId": 1818575,
//  "firstName": "Max",
//  "lastName": "Mustermann",
//  "email": "ma@muster.de"
// https://booking-server.leomirco.repl.co/bcserver/createReservation?arrivaldate=2023-08-27&departuredate=2023-08-28&apartmentid=1818575&firstname=Max&lastname=Mustermann&email=ma@muster.de
router.post('/createReservation', async (req, res) => {
  let arrivalDate = req.body.arrivalDate;
  let departureDate = req.body.departureDate;
  let apartmentid = req.body.apartmentId;
  let firstname = req.body.firstName;
  let lastname = req.body.lastName;
  let email = req.body.email;
  let projectId = req.body.projectId;
  console.log("bcserver/createReservation/req", req.body);
  console.log("bcserver/createReservation/projectId", projectId);
  var sett = await db.get(projectId);
  console.log("bcserver/createReservation/sett", sett);
  let booking_api = sett.booking_sistem_integration_api;

  console.log("bcserver/createReservation/user_key", sett.booking_userkey);
  console.log("bcserver/createReservation/integration sw", booking_api);
  console.log("bcserver/createReservation/req.body", req.body);
  // IF CONNECT WITH SMOOBU API
  if (booking_api === "smoobu") {
    try {
      let bodydata = {
        arrivalDate: arrivalDate,
        departureDate: departureDate,
        apartmentId: apartmentid,
        firstName: firstname,
        lastName: lastname,
        email: email
      };
      var sett = await db.get(projectId);
      console.log('/payment/created/SETTINGS', sett);
      const smoobuClient = new smoobuService({ APPS_API_URL: sett.booking_api_url, USER_KEY: sett.booking_userkey });
      let userData = await smoobuClient.createReservation(bodydata);
      console.log('bcserver/createReservation/userData', userData);
      if (userData) {
        return res.send(userData);
      } else {
        return res.status(400).send({ success: false, msg: 'Error createReservation.' });
      }
    }
    catch (err) {
      console.error('GET createReservation ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error createReservation.' });
    }
  }
  else {
    // IF CONNECT WITH ATHER SW
    // INSERT THE INTEGRATION CODE API
    console.log('BOOKING API NOT CONFIGURED!');
  }

});

//TEST FUNCTION CANCEL RESERVATION
// reservationId = in params
//https://booking-server.leomirco.repl.co/bcserver/deleteReservation/44203040
//router.get('/deleteReservation/:reservationId', async (req, res) => {

router.post('/deleteReservation', async (req, res) => {
  let reservationId = req.body.reservationId;
  console.log("bcserver/deleteReservation/reservationId", reservationId);
  let projectId = req.body.projectid;
  console.log("bcserver/deleteReservation/projectId", projectId);
  var sett = await db.get(projectId);
  console.log('/bcserver/deleteReservation/SETTINGS', sett);
  console.log("bcserver/deleteReservation/user_key", sett.booking_userkey);
  let booking_api = sett.booking_sistem_integration_api;
  // IF CONNECT WITH SMOOBU API
  if (booking_api === "smoobu") {
    try {
      let bodydata = {
        reservationId: reservationId
      };
      const smoobuClient = new smoobuService({ APPS_API_URL: sett.booking_api_url, USER_KEY: sett.booking_userkey });
      let userData = await smoobuClient.deleteReservation(bodydata);
      console.log('bcserver/deleteReservation/userData', userData);
      if (userData) {
        res.send(userData);
      } else {
        return res.status(400).send({ success: false, msg: 'Error deleteReservation.' });
      }
    }
    catch (err) {
      console.error('GET deleteReservation ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleteReservation.' });
    }
  }
});
//TEST FUNCTION GET INFO APPARTMENT
// apartmentId = in params
// https://booking-server.leomirco.repl.co/bcserver/getApartmentInfo/1818704
router.get('/getApartmentInfo/:apartmentId', async (req, res) => {
  let apartmentId = req.params.apartmentId;
  console.log("bcserver/getApartmentInfo/user_key", USER_KEY);
  var sett = await db.get(projectId);
  console.log("bcserver/createReservation/sett", sett);
  let booking_api = sett.booking_sistem_integration_api;
  // IF CONNECT WITH SMOOBU API
  if (booking_api === "smoobu") {
    try {
      let bodydata = {
        apartmentId: apartmentId
      };
      var sett = await db.get(projectId);
      console.log('/payment/created/SETTINGS', sett);
      const smoobuClient = new smoobuService({ APPS_API_URL: sett.booking_api_url, USER_KEY: sett.booking_userkey });
      let userData = await smoobuClient.getAppartmentInfo(bodydata);
      console.log('bcserver/getApartmentInfo/userData', userData);
      if (userData) {
        res.send(userData);
      } else {
        return res.status(400).send({ success: false, msg: 'Error getApartmentInfo.' });
      }
    }
    catch (err) {
      console.error('GET createReservation ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error getApartmentInfo.' });
    }
  }
});

// TEST FUNCTION GET ALL BOOKING OF THE USER
//   arrivalFrom': '2023-08-14',
//  'departureFrom': '2023-08-22',
// https://booking-server.leomirco.repl.co/bcserver/getallreservation?arrivalFrom=2023-08-30&arrivalTo=2023-09-13&projectid=64d2064cc798ef0013a6d3e4
router.get('/getallreservation', async (req, res) => {
  let arrivalFrom = req.query.arrivalFrom;
  let arrivalTo = req.query.arrivalTo;
  let projectId = req.query.projectid;
  console.log("bcserver/getallreservation/req", req.query);
  console.log("bcserver/getallreservation/projectId", projectId);
  var sett = await db.get(projectId);
  console.log("bcserver/getallreservation/sett", sett);
  let booking_api = sett.booking_sistem_integration_api;

  console.log("bcserver/getallreservation/user_key", sett.booking_userkey);
  console.log("bcserver/getallreservation/integration sw", booking_api);
  // IF CONNECT WITH SMOOBU API
  if (booking_api === "smoobu") {
    try {
      let bodydata = {
        arrivalFrom: arrivalFrom,
        arrivalTo: arrivalTo,
      };
      var sett = await db.get(projectId);
      console.log('getallreservation/SETTINGS', sett);
      const smoobuClient = new smoobuService({ APPS_API_URL: sett.booking_api_url, USER_KEY: sett.booking_userkey });
      let userData = await smoobuClient.getAllReservation(bodydata);
      //console.log('bcserver/getallreservation/userData', userData);
      if (userData) {
        return res.send(userData);
      } else {
        return res.status(400).send({ success: false, msg: 'Error getallreservation.' });
      }
    }
    catch (err) {
      console.error('GET createReservation ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error getallreservation.' });
    }
  }
  else {
    // IF CONNECT WITH ATHER SW
    // INSERT THE INTEGRATION CODE API
    console.log('BOOKING API NOT CONFIGURED!');
  }

});

//TEST FUNCTION GET RESERVATION INFO
// apartmentId = in params
// https://booking-server.leomirco.repl.co/bcserver/getApartmentInfo/1818704
router.get('/getReservationInfo/:reservationId', async (req, res) => {
  let reservationId = req.params.reservationId;
  let projectId = req.query.projectid;
  console.log("bcserver/getallreservation/projectId", projectId);
  console.log("bcserver/getallreservation/reservationId", reservationId);
  var sett = await db.get(projectId);
  console.log("bcserver/getReservationInfo/sett", sett);
  let booking_api = sett.booking_sistem_integration_api;
  // IF CONNECT WITH SMOOBU API
  if (booking_api === "smoobu") {
    try {
      let bodydata = {
        reservationId: reservationId,
      };
      var sett = await db.get(projectId);
      console.log('/getReservationInfo/SETTINGS', sett);
      const smoobuClient = new smoobuService({ APPS_API_URL: sett.booking_api_url, USER_KEY: sett.booking_userkey });
      let userData = await smoobuClient.getReservationInfo(bodydata);
      console.log('bcserver/getReservationInfo/userData', userData);
      if (userData) {
        res.send(userData);
      } else {
        return res.status(400).send({ success: false, msg: 'Error getReservationInfo.' });
      }
    }
    catch (err) {
      console.error('GET getReservationInfo ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error getReservationInfo.' });
    }
  }
});


// RESERVATION CHATBOT 
// WORKFLOW API
// https://booking-server.leomirco.repl.co/bcserver/bot
router.post('/bot', async (req, res) => {
  //console.log("req.body:", req.body);
  console.log('body.projectId', req.body.payload.bot.id_project);
  console.log('body.requestId', req.body.payload.message.request.request_id);
  console.log('body.token', req.body.token);
  const token = req.body.token;
  var projectId = req.body.payload.bot.id_project;
  const request_id = req.body.payload.message.request.request_id;
  const received_message = req.body.payload.message.text;
  console.log('req.body.message.text', received_message);

  // DEFINE INTENT
  const intent = req.body.payload.intent.intent_display_name;
  console.log("Intent:", intent)

  // TILEDESK MESSAGE
  const tdclient = new TiledeskClient(
    {
      APIKEY: TILEDESK_API_KEY,
      projectId: projectId,
      token: token,
      APIURL: TILEDESK_API_VER
    })

  // START I CHATBOT
  if (projectId != null && token != null && tdclient != null && received_message == "\\start11") {
    try {
      tdclient.sendSupportMessage(
        request_id,
        {
          text: 'Hello what do you want to do?',
          attributes: {
            attachment: {
              type: "template",
              buttons: [
                {
                  type: "text",
                  value: "book a room"
                },
                {
                  type: "text",
                  value: "cancel a reservation"
                }
              ]
            }
          }
        },
        (err, result) => {
          assert(err === null);
          assert(result != null);
        });
    } catch (error) {
      console.error('STRIPE ERROR NEW CUSTOMER', error.toString().slice(0, 50));
      // SEND ERROR TO THE CHAT
    }
  } // END START IF

  // CANCEL BOOKING
  if (projectId != null && token != null && tdclient != null && intent == "cancel booking") {
    try {
      // cancel a reservation
      let project_id = req.body.variables.project_id;
      console.log('cancel booking/project_id', project_id);
      let user_id = req.body.variables.user_id;
      console.log('book a room/user_id', user_id);
      let reservationId = req.body.variables.reservation_number;
      console.log('book a room/reservationId', reservationId);
      // CALL THE SERVICE FOR CANCELL THE PRENOTATION
      if (projectId) {

        // create a TiledeskClient instance
        const tdclient = new TiledeskClient(
          {
            APIKEY: TILEDESK_API_KEY,
            projectId: project_id,
            token: token,
            APIURL: TILEDESK_API_VER
          })
        var message = {
          type: "frame",
          metadata: {
            src: DOMAIN + '/bcserver/booking/delete/' + reservationId + '/?projectid=' + project_id + '&token=' + token + '&request_id=' + request_id,
            width: '100%',
            height: '330px'
          }
        }
        tdclient.sendSupportMessage(
          request_id,
          message, async (err, result) => {
            if (err) {
              return res.status(500).send({ error: err });
            }
            console.log('iframe choice structure sent');
          });
      }
    } catch (error) {
      console.error('ERROR ', error.toString().slice(0, 50));
      // SEND ERROR TO THE CHAT
    }

  } // END START IF

  // BOOK A PROPERTY
  //https://booking-server.leomirco.repl.co/bcserver/getAvailability?arrivaldate=2023-08-08&departuredate=2023-08-10&customerId=660362
  if (projectId != null && token != null && tdclient != null && intent === "book a room") {
    try {
      // SEARCH THE AVAILABILITY
      let project_id = req.body.variables.project_id;
      console.log('book a room/project_id', project_id);
      let user_id = req.body.variables.user_id;
      console.log('book a room/user_id', user_id);
      let arrival_date = req.body.variables.arrival_date;
      console.log('book a room/arrival_date', arrival_date);
      let departure_date = req.body.variables.departure_date;
      console.log('book a room/departure_date', departure_date);
      let number_people = req.body.variables.number_people;
      console.log('book a room/number_people', number_people);
      console.log('book a room/requestId', request_id);
      let customerid;
      var sett = await db.get(projectId);
      console.log('/BOT - Read settings APP', sett);
      if (projectId && sett) {
        customerid = sett.customerid;
        // CREA UNA PAGINA CON TUTTI GLI APPARTAMENTI TROVATI ... E SPARA IL LINK SULLA CHAT!
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = today.getFullYear();
        //today1 = dd + '/' + mm + '/' + yyyy;
        console.log('Date Today :', today);
        let arrivalDate = new Date(arrival_date);
        let departureDate = new Date(departure_date);
        console.log('today :', today);
        console.log('arrivalDate :', arrivalDate);
        // create a TiledeskClient instance
        const tdclient = new TiledeskClient(
          {
            APIKEY: TILEDESK_API_KEY,
            projectId: project_id,
            token: token,
            APIURL: TILEDESK_API_VER
          })

        if (arrivalDate >= today && departureDate >= today) {
          // RESPOSE AVAILABILITY - LIST THE APPARTMENT
          // SEND MSG FOR PAY
          var message = {
            type: "frame",
            metadata: {
              //src: DOMAIN + '/?clientSecret=' + clientSecret + '&projectId=' + projectId + '&orderId=' + orderId,
              src: DOMAIN + '/bcserver/bblist' + '/?arrival_date=' + arrival_date + '&departure_date=' + departure_date + '&customerid=' + customerid + '&project_id=' + project_id + '&token=' + token + '&number_people=' + number_people + '&request_id=' + request_id,
              width: '100%',
              height: '330px'
            }
          }
          tdclient.sendSupportMessage(
            request_id,
            message, async (err, result) => {
              if (err) {
                return res.status(500).send({ error: err });
              }
              console.log('iframe choice structure sent');
            });
          // SELEZIONA UN APPARTAMENTO E PAGA CON STRIPE

        }
        else {
          console.log('arrivalDate antecedente a today');
          tdclient.sendSupportMessage(
            request_id,
            { text: 'It is not possible to enter an arrival or departure date before today!' },
          );
        }
      }
    } catch (error) {
      console.error('BOOK A ROOM ERROR', error.toString().slice(0, 50));
      // SEND ERROR TO THE CHAT
    }
  }

  // END CHATBOT WEBHOOK
});

// END SERVER
module.exports = router;

// *****************************
// ********* FUNCTIONS *********
// *****************************
function readHTMLFile(templateName, dir, callback) {
  var perc = __dirname + dir + templateName;
  console.log("Reading file: ", perc)
  console.log("Reading __dirname: ", __dirname)
  fs.readFile(__dirname + dir + templateName, { encoding: 'utf-8' },
    function(err, html) {
      if (err) {
        throw err;
        //callback(err);
      } else {
        callback(null, html)
      }
    })
}

function writeButton(projectId, token, request_id) {
  // SEND THE START PROCESS BUTTON
  console.log('writeButton');
  // TILEDESK MESSAGE
  const tdclient = new TiledeskClient(
    {
      APIKEY: TILEDESK_API_KEY,
      projectId: projectId,
      token: token,
      APIURL: TILEDESK_API_VER
    })

  // START I CHATBOT
  if (projectId != null && token != null && tdclient != null) {
    try {
      tdclient.sendSupportMessage(
        request_id,
        {
          text: 'Do you want to perform other operations?',
          attributes: {
            attachment: {
              type: "template",
              buttons: [
                {
                  type: "text",
                  value: "/book a room"
                },
                {
                  type: "text",
                  value: "/cancel booking"
                }
              ]
            }
          }
        },
        (err, result) => {
          assert(err === null);
          assert(result != null);
        });
    } catch (error) {
      console.error('WRITE ERROR', error.toString().slice(0, 50));
      // SEND ERROR TO THE CHAT
    }
  } // END START IF
}