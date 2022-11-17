import web_socket from "ws";
import atob from 'atob';
import pako from 'pako';

let triggers = {
     "connect": [],
     "tick": []
};

let WebSocketOrderStatus = function (params) {
     let self = this;
     let ws = null;

     let clientcode = params.clientcode || null;
     let jwttoken = params.jwttoken || null;
     let apikey = params.apikey || null;
     let feedtype = params.feedtype || "order_feed";

     let url = params.url || "wss://smartapisocket.angelbroking.com/websocket?jwttoken=" + jwttoken + "&clientcode=" + clientcode + "&apikey=" + apikey;



     this.connect = function () {
          return new Promise((resolve, reject) => {
               if (clientcode === null || jwttoken === null || apikey === null || feedtype === null) return "client_code or jwt_token or api_key or feed_type is missing";
               ws = new web_socket(url, null, { rejectUnauthorized: false });
               ws.onopen = function onOpen(evt) {
                    setInterval(function () {
                         var _hb_req = '{"actiontype":"heartbeat","feedtype":"' + feedtype + '","jwttoken":"' + jwttoken + '","clientcode": "' + clientcode + '", "apikey": "' + apikey + '"}';
                         ws.send(_hb_req);
                    }, 60000);
                    resolve()
               };
               ws.onmessage = function (evt) {
                    // console.log(evt);
                    var result = evt.data;
                    trigger("tick", [JSON.parse(result)]);
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

     this.fetchData = function (actiontype, feedtype) {
          if (actiontype === null) return "task is missing";
          if (actiontype === "subscribe" || actiontype === "unsubscribe") {
               var _req = '{"actiontype":"' + actiontype + '","feedtype":"' + feedtype + '","jwttoken":"' + jwttoken + '","clientcode": "' + clientcode + '", "apikey": "' + apikey + '"}';
               ws.send(_req);
          } else return "Invalid action_type provided";
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

export default WebSocketOrderStatus;