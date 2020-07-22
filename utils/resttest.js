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
    price: 9200,
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
  const wsstream = new webSocket(
    `wss://stream.binancefuture.com/ws/${listenKey}`
  );
  wsstream.on("open", () => {
    console.log("websocket opened");
  });
  wsstream.on("message", data => {
    console.log(data);
  });
  wsstream.on("error", err => {
    console.log(err.message);
  });
  console.log("ws initiated", listenKey);
  keepConnectionAlive();
  return wsstream;
}

function startUserDataStream() {
  return listenKey("GET")
    .then(value => {
      createWebSocket(value.listenKey);
    })
    .catch(err => console.log(err.message));
}
startUserDataStream();

function placeTakeProfitOrder(params) {
  //let timestamp = new Date().getTime();
  //console.log(timestamp);
  //const params = {
  //  symbol: "BTCUSDT",
  //  side: "BUY",
  //  type: "TRAILING_STOP_MARKET",
  //  quantity: 1,
  //  //timeInForce: "GTC",
  //  price: 9410,
  //  stopPrice: 9410,
  //  callbackRate: 0.2,
  //  //recvWindow: 500000,
  //  timestamp: timestamp
  //};

  let res = makeSignature(params);
  params.signature = res;
  let qs = res.qs + "signature=" + res.signature;
  //console.log(qs);

  return fetch(testingAPI + "/fapi/v1/order" + "?" + qs, {
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
    .then(r => r)
    .catch(err => console.log(err.message));
}
//placeTakeProfitOrder();
function convertIntoOrderParams(
  symbol,
  side,
  type,
  price,
  quantity,
  stopPrice,
  callbackRate
) {
  let timestamp = new Date().getTime();
  let params = {
    symbol,
    side,
    type,
    quantity,
    timestamp
  };
  if (type === "MARKET") {
    return { ...params };
  } else if (type === "STOP_MARKET") {
    return { ...params, stopPrice };
  } else if (type === "TAKE_PROFIT_MARKET") {
    return { ...params, stopPrice };
  }
}
let c = convertIntoOrderParams("BTCUSDT", "BUY", "MARKET", null, 1, null, null);
let d = convertIntoOrderParams(
  "BTCUSDT",
  "SELL",
  "STOP_MARKET",
  null,
  1,
  9000,
  null
);
let e = convertIntoOrderParams(
  "BTCUSDT",
  "SELL",
  "TAKE_PROFIT_MARKET",
  null,
  1,
  9500,
  null
);
//console.log(c);
//console.log(d);
//console.log(e);
//const orders = Promise.all([e].map(params => placeTakeProfitOrder(params)))
//  .then(values => {
//    console.log(values);
//    return values;
//  })
//  .then(res => console.log(res))
//  .catch(err => console.log(err.message));
function cancelOrder(symbol, orderId, timestamp) {
  const params = { symbol, orderId, timestamp: new Date().getTime() };
  let res = makeSignature(params);
  params.signature = res;
  let qs = res.qs + "signature=" + res.signature;

  return fetch(testingAPI + "/fapi/v1/order" + "?" + qs, {
    method: "DELETE",
    headers: {
      "X-MBX-APIKEY": binanceAPI
      //  "Content-Type": "application/json"
    }
  })
    .then(res => {
      return res.json();
    })
    .then(r => {
      console.log("result", r);
      return r;
    })
    .catch(err => console.log(err.message));
}
//cancelOrder("BTCUSDT", 2494859858);
//cancelOrder("BTCUSDT", 2494643395, 1592221861750);
