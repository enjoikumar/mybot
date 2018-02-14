'use strict';

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Initialize dashbot.io
const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY, {debug: true}).facebook;

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

  // Parse the request body from the POST
  let body = req.body;
  
  dashbot.logIncoming(req.body);

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      
      //console.log(webhook_event);
      
      let sender = webhook_event.sender.id;
      if(webhook_event.message) {
        if(webhook_event.message.text) {
          let msg = webhook_event.message.text.toLowerCase();
          if(msg === 'hello') {
            sendTextMessage(sender, 'hey there') 
          }
          else if(msg === 'bye') {
            sendTextMessage(sender, 'Okay...bye now') 
          }
          else if(msg === 'photo') {
            sendImage(sender, 'http://cdn1-www.dogtime.com/assets/uploads/2011/03/puppy-development-300x200.jpg') // Find an image URL to insert here.
          }
          else if(msg ==='joke') {
            sendTextMessage(sender, 'A skeleton walks into a bar, asks for a beer and a mop.')
          }
          else {
            sendTextMessage(sender, 'you said: ' +msg+ '. But can you change it') 
          }
        }
        else if (webhook_event.message.attachments){
          webhook_event.message.attachments.forEach(function(attachment) {
            switch(attachment.type) {
              case 'image':
                sendTextMessage(sender, 'thanks for the image')
                break;
              case 'audio':
                sendTextMessage(sender, 'thanks for the audio')
                break;
              case 'video':
                sendTextMessage(sender, 'thanks for the video')
                break;
              case 'location':
                sendTextMessage(sender, 'thanks for the location')
                break;
              default:
                sendTextMessage(sender, 'sorry, I didn\'t recongize that')
            }
          })
        }
      }
      
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

app.get('/', (req, res) => {
  res.send('hello')
});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = 'KumarIsCool';

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Build the request object to send the message to the user 
function sendMessage(recipient, message) {
 const requestData = {
  uri: 'https://graph.facebook.com/v2.6/me/messages',
  qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
  method: 'POST',
  json: {
    recipient: {id: recipient},
    message: message
  }
 }
 
// Build the request object to send the message to the user
 request(requestData, function(error, resp, body) {
   
   // Log outgoing message to dashbot.io
   dashbot.logOutgoing(requestData, resp.body);
   if(!error && resp.statusCode == 200) {
     let recipientId = body.recipient_id;
     let messageId = body.message_id;
     console.log('Success: message %s to sent user %s', messageId, recipientId)
   }
   else if(error) {
     console.log("Error sending:", error) 
   }
   else if(resp.body.error) {
     console.log("Error: ", resp.body.error) 
   }
 });
}

// Method to send text messages to the user
function sendTextMessage(recipient, str) {
 let message = {
   text: str
 }
 sendMessage(recipient, message)
}

// Method to send images to the user
function sendImage(recipient, imgUrl) {
 let message = {
  attachment: {
    type: 'image',
    payload: {
      url: imgUrl
    }
  }
 }
 sendMessage(recipient, message)
}