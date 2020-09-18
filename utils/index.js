const fetch = require("node-fetch");
const crypto = require("crypto");
const webSocket = require("ws");
//const {
//  symbol,
//  binanceAPI,
//  binanceSecret,
//  OrderAPI,
//  userStream,
//} = require("../strategies/doubleHullDailyIchimokuMacd/parameters.js");
//console.log("user stream api: ", userStream);

//calulcates the risk parameters of the trading strategy based
//portfolio amount in $,
//riskPerTrade in % of portfolio amount,
//stopLossAmount amount to risk per 1btc is usd
//takeProfitAmount amount to risk per 1 btc in usd
//trailForEach to be implemented.
const transformRiskParameters = (riskParameters) => {
  if (!riskParameters) {
    throw new Error("riskParameters are mandatory");
  }
  if (
    !riskParameters.portfolio ||
    !riskParameters.riskPerTrade ||
    !riskParameters.stopLossAmount ||
    !riskParameters.takeProfitAmount ||
    !riskParameters.trailForEach
  ) {
    throw new Error(
      "portfolio,riskperTrade, stopLossAmount,takeProfitAmount, trailForEach are mandatory"
    );
  }
  const {
    portfolio,
    riskPerTrade,
    stopLossAmount,
    takeProfitAmount,
    trailForEach,
  } = riskParameters;
  let r, q;
  r = (portfolio * riskPerTrade) / 100;
  q = r / stopLossAmount;
  return {
    quantity: q,
    stopLossAmount,
    takeProfitAmount,
  };
};

//creates signature from binanceSecret used
//to sign the api requests so that the exchange can identify us.
function makeSignature(obj, binanceSecret) {
  //console.log("makeSignature", obj, binanceSecret);
  let s = "",
    res;
  Object.keys(obj).forEach((e) => {
    s = s + e + "=" + obj[e] + "&";
  });
  //console.log(s.slice(0, s.length - 1));
  const hmac = crypto.createHmac("sha256", binanceSecret);
  hmac.update(s.slice(0, s.length - 1));
  res = hmac.digest("hex");
  return { qs: s, signature: res };
}

function placeOrder(params, OrderAPI, binanceSecret, binanceAPI) {
  //console.log("placeOrder", params, OrderAPI, binanceSecret, binanceAPI);
  let res = makeSignature(params, binanceSecret);
  //params.signature = res;
  let qs = res.qs + "signature=" + res.signature;
  //console.log(qs);

  return (
    fetch(OrderAPI + "/fapi/v1/order" + "?" + qs, {
      method: "POST",
      headers: {
        "X-MBX-APIKEY": binanceAPI,
        //  "Content-Type": "application/json"
      },
    })
      .then((res) => {
        //console.log(res);
        return res.json();
      })
      //.then((r) => console.log(r))
      .catch((err) => console.log(err.message))
  );
}

//gets the listen key, listen key is used to listen
//to the user data streams.which takes an input of method
//if we use "POST", we ask the exchange for new listenkey
//if we use "KEEPALIVE", we extend the lifetime of the
//exchange key by one hour. so we need to keep on calling
//"KEEPALIVE"
function listenKey(s, OrderAPI, binanceAPI) {
  //console.log("listenKey", OrderAPI, binanceAPI);
  let method = {
    GET: "POST",
    KEEPALIVE: "PUT",
    DELETE: "DELETE",
  };
  let key = "";
  return fetch(OrderAPI + "/fapi/v1/listenKey", {
    method: method[s],
    headers: {
      "X-MBX-APIKEY": binanceAPI,
      ContentType: "application/json",
    },
    body: JSON.stringify({}),
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => console.log(err.message));
}

//a wrapper function for listen key makes it
//easier to chain.

function ListenKey(value, OrderAPI, binanceAPI) {
  //console.log("ListenKey", value, OrderAPI, binanceAPI);
  return (
    listenKey(value, OrderAPI, binanceAPI)
      //.then(res => console.log(res))
      .catch((err) => console.log(err.message))
  );
}

//Logic to call the exchange for every 45mins
//actually the default is 1hr for our safety
//i have decreased this to 45mins
function keepConnectionAlive(OrderAPI, binanceAPI) {
  //console.log("keepConnectionAlive", OrderAPI, binanceAPI);
  ListenKey("KEEPALIVE", OrderAPI, binanceAPI)
    .then(() => {
      setTimeout(() => {
        console.log("keepalive sent");
        keepConnectionAlive(OrderAPI, binanceAPI);
      }, 45 * 60 * 1000);
    })
    .catch((err) => {
      console.log(err.message);
    });
}

//creates web socket connection using listen key
//and initiates the keep connection alive logic
function createWebSocket(listenKey, userStream, OrderAPI, binanceAPI) {
  //console.log("createWebSocket", listenKey, userStream, OrderAPI, binanceAPI);
  const wsstream = new webSocket(`${userStream}${listenKey}`);
  console.log("websocket initiated");
  wsstream.on("open", () => {
    console.log("websocket opened");
  });
  wsstream.on("error", (err) => {
    console.log(err.message);
  });
  keepConnectionAlive(OrderAPI, binanceAPI);
  return wsstream;
}

//function createWebSocket(listenKey) {
//  const wsstream = new webSocket(`${userStream}${listenKey}`);
//  wsstream.on("open", () => {
//    console.log("websocket opened");
//  });
//  wsstream.on("error", (err) => {
//    console.log(err.message);
//  });
//  console.log("ws initiated", listenKey);
//  keepConnectionAlive();
//  return wsstream;
//}

//combines all the above, gets the listen key,
//creates web socket and attaches listeners to it,
//initiates the keep alive logic
function startUserDataStream(userStream, OrderAPI, binanceAPI) {
  //console.log("startUserDataStream", userStream, OrderAPI, binanceAPI);
  return listenKey("GET", OrderAPI, binanceAPI)
    .then((value) => {
      return createWebSocket(value.listenKey, userStream, OrderAPI, binanceAPI);
    })
    .catch((err) => console.log(err.message));
}

//converst the incomming data into the parameters
//acceptable by the exchange.
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
    timestamp,
  };
  if (type === "MARKET") {
    return { ...params };
  } else if (type === "STOP_MARKET") {
    return { ...params, stopPrice };
  } else if (type === "TAKE_PROFIT_MARKET") {
    return { ...params, stopPrice };
  }
}

//take in order id and symbol and cancels the order.
function cancelOrder(symbol, orderId, OrderAPI, binanceSecret, binanceAPI) {
  //console.log(
  //  "cancelOrder",
  //  symbol,
  //  orderId,
  //  OrderAPI,
  //  binanceSecret,
  //  binanceAPI
  //);
  const params = { symbol, orderId, timestamp: new Date().getTime() };
  let res = makeSignature(params, binanceSecret);
  params.signature = res;
  let qs = res.qs + "signature=" + res.signature;

  return fetch(OrderAPI + "/fapi/v1/order" + "?" + qs, {
    method: "DELETE",
    headers: {
      "X-MBX-APIKEY": binanceAPI,
      //  "Content-Type": "application/json"
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((r) => {
      console.log("result", r);
      return r;
    })
    .catch((err) => console.log(err.message));
}
//cancelOrder("BTCUSDT", 252213899, OrderAPI, binanceSecret, binanceAPI);

//exports
module.exports = {
  transformRiskParameters,
  makeSignature,
  placeOrder,
  cancelOrder,
  convertIntoOrderParams,
  startUserDataStream,
  listenKey,
  ListenKey,
};
