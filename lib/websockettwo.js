import web_socket from "ws";
import atob from 'atob';
import { inflate } from 'pako';

let triggers = {
     "connect": [],
     "tick": []
};

let WebSocketTwo = function (params) {
     let self = this;
     let ws = null;

     let url = params.url || "ws://smartapisocket.angelone.in/smart-stream";
     let jwt_token = params.jwt_token || null;
     let api_key = params.jwt_token || null;
     let client_code = params.client_code || null;
     let feed_token = params.feed_token || null;

     let headers = {
          "Authorization": jwt_token,	//   Yes	jwt auth token received from Login API
          "x-api-key": api_key,         // 	Yes	API key
          "x-client-code": client_code, //	Yes	client code(Angel Onetrading account id)
          "x-feed-token": feed_token    //	Yes	feed token received fromLogin API
     }

     this.connect = function () {
          return new Promise((resolve, reject) => {
               if (client_code === null || jwt_token === null) return "client_code or jwt_token";

               ws = new web_socket(url, null, { rejectUnauthorized: false, headers: headers });
               ws.onopen = function onOpen(evt) {
                    var _req = 'ping';
                    ws.send(_req);

                    setInterval(function () {
                         var _hb_req = 'ping';
                         ws.send(_hb_req);
                    }, 30000);
                    resolve()
               };
               ws.onmessage = function (evt) {
                    let strData = atob(evt.data);

                    // Convert binary string to character-number array
                    var charData = strData.split('').map(function (x) { return x.charCodeAt(0); });

                    // Turn number array into byte-array
                    var binData = new Uint8Array(charData);

                    // Pako magic
                    var result = _atos(inflate(binData));

                    // console.log(result)
                    const data = result === '{"pong":"pong"}' ? result : JSON.parse(result);
                    trigger("tick", [data]);
               };
               ws.onerror = function (evt) {
                    console.log("error::", evt)
                    self.connect();
                    reject(evt)
               };
               ws.onclose = function (evt) {
                    console.log("Socket closed")
               };
          })
     }

     /**
      * 
      * @param {JSON} script 
      * @returns 
      * Sample data
      * {
               "correlationID": "abcde12345",
               "action": 1,
               "params": {
                    "mode": 1,
                    "tokenList": [
                         {
                              "exchangeType": 1,
                              "tokens": [
                                   "10626",
                                   "5290"
                              ]
                         },
                         {
                              "exchangeType": 5,
                              "tokens": [
                                   "234230",
                                   "234235",
                                   "234219"
                              ]
                         }
                    ]
               }
          }
      *
      */
     this.runScript = function (script) {
          if (script === null) return "task is missing";
          try {
               ws.send(script);
          } catch (error) {
               return error
          }
     };

     this.on = function (e, callback) {
          if (triggers.hasOwnProperty(e)) {
               triggers[e].push(callback);
          }
     };


     this.close = function () {
          ws.close()
     }
}

function _atos(array) {
     var newarray = [];
     try {
          for (var i = 0; i < array.length; i++) {
               newarray.push(String.fromCharCode(array[i]));
          }
     } catch (e) { }

     return newarray.join('');
}

// trigger event callbacks
function trigger(e, args) {
     if (!triggers[e]) return
     for (var n = 0; n < triggers[e].length; n++) {
          triggers[e][n].apply(triggers[e][n], args ? args : []);
     }
}

export default WebSocketTwo;

// Docs will found at
// https://smartapi.angelbroking.com/docs/WebSocket2