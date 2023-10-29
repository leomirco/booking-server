//------------------------------------------------------------------------------


"use strict";
const express = require("express");
//const router = express.Router();
// BODY PARSER
const bodyParser = require('body-parser');
// SECRET VARIABLE
var PORT = process.env.PORT;
//var SMOOBU_URL = process.env.SMOOBU_URL;

// import node-fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) =>
  fetch(...args));

class smoobuService {

  // COSTRUCTOR
  constructor(config) {
    if (!config) {
      throw new Error('config is mandatory');
    }

    if (!config.APPS_API_URL || !config.USER_KEY) {
      throw new Error('config.APPS_URL and config.USER_KEY are mandatory');
    }

    this.smoobu_url = config.APPS_API_URL;
    this.user_key = config.USER_KEY;

    this.log = false;
    if (config.log) {
      this.log = config.log;
    }
  }

  // GETUSER
  async getUser() {
    console.log("smoobuService/user_key: ", this.user_key);
    try {
      const url = this.smoobu_url + '/api/me';
      console.log('smoobu_url', url);
      //Header
      const customHeaders = {
        'Api-Key': this.user_key,
        'cache-control': 'no-cache'
      }
      // call GetUser
      const apiResponse = await fetch(url, {
        headers: customHeaders,
      });
      console.log("apiResponse.status", apiResponse.status);
      if (apiResponse.status == 200) {
        const data = await apiResponse.json();
        console.log("apiResponse JSON", data);
        return data;
      } else {
        return apiResponse.json();
      }
    }
    catch (err) {
      console.error('GET availability ERROR ', err);
      return { success: false, msg: 'Error getting availabilitys.' };
    }

  }

  // TEST FUNCTION CHECK APARTMENT AVAILABILITY
  //    "arrivalDate" : "2023-08-08",
  //    "departureDate":  "2023-08-10",
  //    "apartments": [1818704],
  //    "customerId": 660362
  async getAvailability(bodydata) {
    console.log("smoobuService/getAvailability");
    try {
      console.log("smoobuService/query:", bodydata);
      const url = this.smoobu_url + '/booking/checkApartmentAvailability';
      console.log('smoobuService/SMOOBU_URL', url);
      const customHeaders = {
        'Api-Key': this.user_key,
        'cache-control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      const options = {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify(bodydata),
      }
      console.log("smoobuService/options", options);
      const apiResponse = await fetch(url, options);
      console.log("smoobuService/status", apiResponse.status);
      if (apiResponse.status == 200) {
        const data = await apiResponse.json();
        //console.log("smoobuService/apiResponse JSON", data);
        return data;
      } else {
        return apiResponse.json();
      }
    }
    catch (err) {
      console.error('smoobuService/GET availability ERROR ', err);
      return { success: false, msg: 'Error getting availabilitys.' };
    }
  }

  // TEST FUNCTION CREATE A RESERVATION
  //   arrivalDate': '2023-08-14',
  //    'departureDate': '2023-08-22',
  //    'apartmentId': 1818575,
  //    'firstName': 'Ilenia',
  //    'lastName': 'Pandelli',
  //    'email': 'pandelli.ilenia@gmail.com'
  async createReservation(bodydata) {
    console.log("smoobuService/createReservation");
    try {
      console.log("smoobuService/query:", bodydata);
      const url = this.smoobu_url + '/api/reservations';
      console.log('smoobuService/SMOOBU_URL', url);
      const customHeaders = {
        'Api-Key': this.user_key,
        'cache-control': 'no-cache',
        'Content-Type': 'application/json'
      }
      const options = {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify(bodydata),
      }
      console.log("smoobuService/options", options);
      const apiResponse = await fetch(url, options);
      console.log("smoobuService/status", apiResponse.status);
      if (apiResponse.status == 200) {
        const data = await apiResponse.json();
        console.log("smoobuService/apiResponse JSON", data);
        return data;
      } else {
        return apiResponse.json();
      }
    }
    catch (err) {
      console.error('smoobuService/createReservation ERROR ', err);
      return { success: false, msg: 'Error getting createReservation.' };
    }
  }

  // DELETE RESERVATION
  async deleteReservation(bodydata) {
    console.log("smoobuService/deleteReservation: ", this.user_key);
    try {
      const url = this.smoobu_url + '/api/reservations/' + bodydata.reservationId;
      console.log('smoobu_url', url);
      //Header
      const customHeaders = {
        'Api-Key': this.user_key,
        'cache-control': 'no-cache'
      }
      const options = {
        method: "DELETE",
        headers: customHeaders,
      }
      // call GetUser
      const apiResponse = await fetch(url, options);
      console.log("apiResponse.status", apiResponse.status);
      if (apiResponse.status == 200) {
        const data = await apiResponse.json();
        console.log("apiResponse JSON", data);
        return data;
      } else {
        return apiResponse.json();
      }
    }
    catch (err) {
      console.error('GET deleteReservation ERROR ', err);
      return { success: false, msg: 'Error getting deleteReservation.' };
    }
  }

  // GET APPARTMENT INFO
  async getAppartmentInfo(bodydata) {
    console.log("smoobuService/getAppartmentInfo: ", this.user_key);
    try {
      const url = this.smoobu_url + '/api/apartments/' + bodydata.apartmentId;
      console.log('smoobuService/smoobu_url', url);
      //Header
      const customHeaders = {
        'Api-Key': this.user_key,
        'cache-control': 'no-cache'
      }
      const options = {
        method: "GET",
        headers: customHeaders,
      }
      // call GetUser
      const apiResponse = await fetch(url, options);
      console.log("apiResponse.status", apiResponse.status);
      if (apiResponse.status == 200) {
        const data = await apiResponse.json();
        console.log("apiResponse JSON", data);
        return data;
      } else {
        return apiResponse.json();
      }
    }
    catch (err) {
      console.error('GET getAppartmentInfo ERROR ', err);
      return { success: false, msg: 'Error getting getAppartmentInfo.' };
    }
  }

  //GET ALL RESERVATION
  // TEST FUNCTION CREATE A RESERVATION
  //   arrivalFrom': '2023-08-14',
  //    'departureFrom': '2023-08-22',

  async getAllReservation(bodydata) {
    console.log("smoobuService/getallreservation");
    try {
      console.log("smoobuService/query:", bodydata);
      const url = this.smoobu_url + '/api/reservations' + '?arrivalFrom=' + bodydata.arrivalFrom + '&arrivalTo=' + bodydata.arrivalTo + '&email=pandelli.ilenia@gmail.com';
      console.log('smoobuService/SMOOBU_URL', url);
      const customHeaders = {
        'Api-Key': this.user_key,
        'cache-control': 'no-cache'
      }
      const options = {
        method: "GET",
        headers: customHeaders,
      }
      console.log("smoobuService/options", options);
      const apiResponse = await fetch(url, options);
      console.log("smoobuService/status", apiResponse.status);
      if (apiResponse.status == 200) {
        const data = await apiResponse.json();
        console.log("smoobuService/apiResponse JSON", data);
        return data;
      } else {
        return apiResponse.json();
      }
    }
    catch (err) {
      console.error('smoobuService/createReservation ERROR ', err);
      return { success: false, msg: 'Error getting createReservation.' };
    }
  }

  //GET RESERVATION INFO
  // TEST FUNCTION CREATE A RESERVATION
  //   reservationId': '2023-08-14',
  async getReservationInfo(bodydata) {
    console.log("smoobuService/getReservationInfo");
    console.log("smoobuService/getReservationInfo: ", this.user_key);
    try {
      console.log("smoobuService/query:", bodydata);
      const url = this.smoobu_url + '/api/reservations/' + bodydata.reservationId;
      console.log('smoobuService/SMOOBU_URL', url);
      const customHeaders = {
        'Api-Key': this.user_key,
        'cache-control': 'no-cache'
      }
      const options = {
        method: "GET",
        headers: customHeaders,
      }
      console.log("smoobuService/options", options);
      const apiResponse = await fetch(url, options);
      console.log("smoobuService/status", apiResponse.status);
      if (apiResponse.status == 200) {
        const data = await apiResponse.json();
        console.log("smoobuService/apiResponse JSON", data);
        return data;
      } else {
        return apiResponse.json();
      }
    }
    catch (err) {
      console.error('smoobuService/getReservationInfo ERROR ', err);
      return { success: false, msg: 'Error getting getReservationInfo.' };
    }
  }

  // END SERVER
}
module.exports = { smoobuService };