# booking-server

The software allows a user of the Tiledesk platform to book an accommodation facility and make the payment online through the market-leading payment gateway Stripe. The software significantly simplifies the purchasing process for customers, allowing them to book and pay in one integrated solution without leaving the chat.

# System Description

![Screenshot 2023-10-30 alle 17 37 20](https://github.com/leomirco/booking-server/assets/6114766/dfb1acd7-a897-4c0b-95f6-45b42a5bf2d7)

# System Architecture

![Screenshot 2023-10-30 alle 18 42 26](https://github.com/leomirco/booking-server/assets/6114766/a44aea19-0785-487e-bca1-82937fff5389)

# Product Functions

- FUN - 01  Operation selection
- FUN - 02  Search for available properties
- FUN - 03  Creating a reservation on the booking system
- FUN - 04 Viewing your reservation
- FUN - 05 Creation of an online payment intention on the Stripe platform
- FUN - 06  Online payment execution on the Stripe platform
- FUN - 07  Cancellation of a reservation
- FUN - 08  Creating a new App configuration
- FUN - 09  Viewing the parameters of the configuration of the App created
- FUN - 10  Changing the parameters of the configuration of the App created

# Install
- create a project on Tiledesk
- in the bot section create a new bot (Add from scratch)
- Now you have to install the App from the Apps section by pressing the Install button
- It is necessary to configure the App with the necessary parameters to allow communication with the facility management platform (e.g. Smoobu) and with the Stripe online payment platform. To do this, go to the Chats section and join a conversation. Then you need to select the Apps button at the bottom of the page on the right of the screen
- You must enter the configuration parameters of the facilities management platform (e.g. Smoobu) and the Stripe electronic payment platform in the appropriate spaces (For these configurations, refer to the guide of your facility manager and the Stripe electronic payment platform).
- Now you have to download the bot project from here (https://booking-server.leomirco.repl.co/bot/holidayBookingBot.json)
- Import the Bot hollidayBookingBot
- As soon as the bot import process finishes you should see the new bot created
- Select the Edit bot button and this should be the result
- Select the Department with which the BOT must work and activate it by pressing the Activate Bot button
- Now you need to create the different rooms/apartments that customers can book on your property management system. The prices of each room/apartment and the periods in which each is available must be entered ()For these configurations, refer to your facilities manager's documentation
- To test the App, select the "Simulate visitor" button at the top right of the screen
- If everything has been configured correctly the bot will start and allow the user to book a room or cancel an old reservation




