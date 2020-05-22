const fetch = require("node-fetch");
const crypto = require("crypto");
const webSocket = require("ws");
const eventEmitter = require("events");
const testingAPI = "https://testnet.binancefuture.com";
const binanceAPI =
  "600044b043eedb449917d9020724b9e9855297a93c7b6fb92f64704cae633a17";
const binanceSecret =
  "b0589308d947920a6a0eb66f13e992d234e5b9943edd9d1d364f8e8f2b4dbb87";

function makeSignature(obj) {
  let s = "",
    res;
  Object.keys(obj).forEach(e => {
    s = s + e + "=" + obj[e] + "&";
  });
  console.log(s.slice(0, s.length - 1));
  const hmac = crypto.createHmac("sha256", binanceSecret);
  hmac.update(s.slice(0, s.length - 1));
  res = hmac.digest("hex");
  return { qs: s, signature: res };
}
//place an order
function placeOrder() {
  let timestamp = new Date().getTime();
  console.log(timestamp);
  const params = {
    symbol: "BTCUSDT",
    side: "BUY",
    type: "LIMIT",
    quantity: 1,
    timeInForce: "GTC",
    price: 5000,
    //recvWindow: 500000,
    timestamp: timestamp
  };

  let res = makeSignature(params);
  params.signature = res;
  let qs = res.qs + "signature=" + res.signature;
  //console.log(qs);

  fetch(testingAPI + "/fapi/v1/order" + "?" + qs, {
    method: "POST",
    headers: {
      "X-MBX-APIKEY": binanceAPI
      //  "Content-Type": "application/json"
    }
  })
    .then(res => {
      //console.log(res);
      return res.json();
    })
    .then(r => console.log(r))
    .catch(err => console.log(err.message));
}

//get listen key
function listenKey(s) {
  let method = {
    GET: "POST",
    KEEPALIVE: "PUT",
    DELETE: "DELETE"
  };
  let key = "";
  return fetch(testingAPI + "/fapi/v1/listenKey", {
    method: method[s],
    headers: {
      "X-MBX-APIKEY": binanceAPI,
      ContentType: "application/json"
    },
    body: JSON.stringify({})
  })
    .then(res => {
      return res.json();
    })
    .catch(err => console.log(err.message));
}

function ListenKey(value) {
  return (
    listenKey(value)
      //.then(res => console.log(res))
      .catch(err => console.log(err.message))
  );
}
//ListenKey("GET");

let ws1;

function keepConnectionAlive() {
  ListenKey("KEEPALIVE")
    .then(() => {
      setTimeout(() => {
        console.log("keepalive sent");
        keepConnectionAlive();
      }, 45 * 60 * 1000);
    })
    .catch(err => {
      console.log(err.message);
    });
}

function createWebSocket(listenKey) {
  function handleMessages(data) {
    console.log(data);
  }
  ws1 = new webSocket(`wss://stream.binancefuture.com/ws/${listenKey}`);
  ws1.on("open", () => {
    console.log("websocket opened");
  });
  ws1.on("message", data => {
    console.log(data);
  });
  ws1.on("error", err => {
    console.log(err.message);
  });
  console.log("ws initiated", listenKey);
  keepConnectionAlive();
}

function startUserDataStream() {
  listenKey("GET")
    .then(value => {
      createWebSocket(value.listenKey);
    })
    .catch(err => console.log(err.message));
}
startUserDataStream();
////signal generation
//sg.vwma = undefined;
//sg.signal = "None";
//sg.generateSignal = function({ payload, label }) {
//  //console.log(label);
//  sg.updatedData[label] = payload;
//  //console.log("signal", this.signal);
//  if (label === "klines1m") {
//    let temp = sg.updatedData.klines1m.slice(450);
//    let close = temp.map(e => Number(e[4]));
//    let volume = temp.map(e => Number(e[5]));
//    //console.log(temp, close, volume);
//    tulind.indicators.vwma.indicator([close, volume], [15], function(
//      err,
//      results
//    ) {
//      if (err) {
//        console.log(err.message);
//        return;
//      }
//      sg.vwma = Number(results[0][results[0].length - 1].toFixed(2));
//      //console.log(sg.vwma);
//      return;
//    });
//    //console.log(
//    //  index,
//    //  label,
//    //  new Date(data[data.length - 1][0]).toTimeString(),
//    //  data[data.length - 1][4]
//    //);
//  } else if (label === "price") {
//    //console.log(sg);
//    if (sg.vwma && payload.p) {
//      if (sg.vwma < Number(payload.p)) {
//        sg.signal = "Buy";
//      } else {
//        sg.signal = "Sell";
//      }
//      //console.log(
//      //  new Date(payload.E).toTimeString().split(" ")[0],
//      //  " ",
//      //  sg.vwma,
//      //  " ",
//      //  payload.p,
//      //  " ",
//      //  sg.signal
//      //);
//    }
//  }
//  try {
//    sg.connector.connection.emit("newData", {
//      label: "signal",
//      payload: {
//        signal: sg.signal,
//        vwma: sg.vwma,
//        price: sg.updatedData.price ? Number(sg.updatedData.price.p) : null
//      }
//    });
//  } catch (err) {
//    console.log(err.message);
//  }
//};
////sg.getData.on("newData", sg.generateSignal);
//tm.intervalBetweenSignals = 6000;
//tm.intervalConditionPassed = false;
//tm.directionDuringInterval = null;
//tm.timer = 0;
//setInterval(() => {
//  tm.active = false;
//}, 30000);
//tm.takeActionBasedOnSignal = function({ label, payload }) {
//  //console.log("action based on signal", "noAction");
//  //console.log(label, payload);
//  //
//  tm.presentPrice = payload.price;
//  if (tm.active) {
//    //check if stop 	loss is hit
//    //if (tm.checkStopLoss()) {
//    //check if take profit is hit
//    //if not reached, check the price, if it is greater than  the previous
//    //high/loww trail the stop loss
//    //console.log("trade active doing nothing");
//  } else {
//    if (tm.intervalConditionPassed) {
//      //console.log("trade initialized");
//      tm.initializeTrade(payload.price, payload.signal);
//      //console.log("details sent to trade placement");
//      //console.log(tm.connector.connection);
//      tm.active = true;
//      tm.connector.connection.emit("newData", {
//        label: "tradeInitialize",
//        payload: [{}, {}, {}]
//      });
//      //console.log("trade active", new Date().toTimeString());
//      tm.intervalConditionPassed = false;
//    } else {
//      if (!tm.intervalProcessing) {
//        //console.log("timer started");
//        tm.intervalProcessing = true;
//        tm.direction = payload.signal;
//        tm.timer = setTimeout(() => {
//          tm.intervalConditionPassed = true;
//          //console.log("timer condition passed");
//          tm.intervalProcessing = false;
//        }, tm.intervalBetweenSignals);
//      } else {
//        if (tm.direction !== payload.signal) {
//          //console.log("timer condition failed");
//          clearTimeout(tm.timer);
//          tm.direction = payload.signal;
//          //console.log("restarting the timer");
//          tm.timer = setTimeout(() => {
//            tm.intervalProcessing = false;
//            tm.intervalConditionPassed = true;
//            //console.log("timer condition passed");
//          }, tm.intervalBetweenSignals);
//        }
//      }
//    }
//  }
//};
//
//connect the connectors to their respective targets
//dataToSignalConnector.connectTarget(sg);
//signalToTradeManagement.connectTarget(tm);
//tradeManagementTotradePlacement.connectTarget(tp);
//tradePlacementToLogger.connectTarget(lg);

//connect connectors to their respective origins
//tp.addConnector(tradePlacementToLogger);
//tm.addConnector(tradeManagementTotradePlacement);
//tm.getData.on("newData", tm.takeActionBasedOnSignal);
//sg.addConnector(signalToTradeManagement);
//wp.addConnector(dataToSignalConnector);
//wp.subscribe(subscription1);

////create connectors
////create data to signal connector
//const dataToSignalConnector = new Connector();
////create signal to trade management connector
//const signalToTradeManagement = new Connector();
////create tradeManagement to tradePlacement connector
//const tradeManagementTotradePlacement = new Connector();
////create tradePlacement to logger connector,
//const tradePlacementToLogger = new Connector();
//create new signal generator
//const sg = new SignalGenerator();
//create new trade management
//const tm = new TradeManagement(50, 100, 10);
//create new trade placement
//const tp = new TradePlacement();
//create new logger
//const lg = new Logger(filepath);
