const fetch = require("node-fetch");
const crypto = require("crypto");
const webSocket = require("ws");
const {
  symbol,
  binanceAPI,
  binanceSecret,
  OrderAPI,
  userStream,
} = require("../parameters.js");
console.log("hi", userStream);

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

const transformRiskParameters1 = (riskParameters) => {
  if (!riskParameters) {
    throw new Error("price and riskParameters are mandatory");
  }
  if (
    !riskParameters.quantity ||
    !riskParameters.riskPerTrade ||
    !riskParameters.profitPerTrade
  ) {
    throw new Error("quantity,riskperTrade, profitPerTrade are mandatory");
  }
  const { quantity, riskPerTrade, profitPerTrade } = riskParameters;
  let r, q;
  stopLossAmount = Number(riskPerTrade) / Number(quantity);
  takeProfitAmount = Number(profitPerTrade) / Number(quantity);
  q = r / stopLossAmount;
  return {
    quantity,
    stopLossAmount,
    takeProfitAmount,
  };
};

function makeSignature(obj) {
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

function placeOrder(params) {
  let res = makeSignature(params);
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

//get listen key
function listenKey(s) {
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

function ListenKey(value) {
  return (
    listenKey(value)
      //.then(res => console.log(res))
      .catch((err) => console.log(err.message))
  );
}
//ListenKey("GET");

function keepConnectionAlive() {
  ListenKey("KEEPALIVE")
    .then(() => {
      setTimeout(() => {
        console.log("keepalive sent");
        keepConnectionAlive();
      }, 45 * 60 * 1000);
    })
    .catch((err) => {
      console.log(err.message);
    });
}

function createWebSocket(listenKey) {
  const wsstream = new webSocket(`${userStream}${listenKey}`);
  console.log("websocket initiated");
  wsstream.on("open", () => {
    console.log("websocket opened");
  });
  wsstream.on("error", (err) => {
    console.log(err.message);
  });
  keepConnectionAlive();
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

function startUserDataStream() {
  return listenKey("GET")
    .then((value) => {
      return createWebSocket(value.listenKey);
    })
    .catch((err) => console.log(err.message));
}

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
function cancelOrder(symbol, orderId) {
  console.log("cancel order id", orderId);
  const params = { symbol, orderId, timestamp: new Date().getTime() };
  let res = makeSignature(params);
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
//cancelOrder("BTCUSDT", 2514192583);
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
