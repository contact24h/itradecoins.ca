const fetch = require("node-fetch");
const crypto = require("crypto");
const { symbol } = require("../parameters.js");
const binanceAPI =
  "600044b043eedb449917d9020724b9e9855297a93c7b6fb92f64704cae633a17";
const binanceSecret =
  "b0589308d947920a6a0eb66f13e992d234e5b9943edd9d1d364f8e8f2b4dbb87";
const testingAPI = "https://testnet.binancefuture.com";

const transformRiskParameters = (price, riskParameters) => {
  if (!price || !riskParameters) {
    throw new Error("price and riskParameters are mandatory");
  }
  if (
    !riskParameters.riskPerTrade ||
    !riskParameters.profitPerTrade ||
    !riskParameters.trailForEach ||
    !riskParameters.portfolio
  ) {
    throw new Error(
      "riskperTrade, profitperTrade, trailForEach, portfolio are mandatory"
    );
  }
  const {
    riskPerTrade,
    profitPerTrade,
    trailForEach,
    portfolio
  } = riskParameters;
  let r, p, t, q;
  if (riskParameters.unit === "percentage") {
    r = (Number(portfolio) * riskPerTrade) / 100;
    p = (Number(portfolio) * profitPerTrade) / 100;
    t = (Number(portfolio) * trailForEach) / 100;
    q = r / price;
  } else {
    r = riskPerTrade;
    p = profitPerTrade;
    t = trailForEach;
    q = riskPerTrade / price;
  }
  return {
    riskPerTrade: r,
    profitPerTrade: p,
    trailForEach: t,
    quantity: q
  };
};

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

function placeOrder(side, price, quantity) {
  let timestamp = new Date().getTime();
  console.log(timestamp);
  const params = {
    symbol,
    side,
    type: "MARKET",
    quantity: 1,
    //timeInForce: "GTC",
    //price: 9200,
    //recvWindow: 500000,
    timestamp: timestamp
  };

  let res = makeSignature(params);
  params.signature = res;
  let qs = res.qs + "signature=" + res.signature;
  //console.log(qs);

  return (
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
      //.then(r => console.log(r))
      .catch(err => console.log(err.message))
  );
}

module.exports = { transformRiskParameters, makeSignature, placeOrder };
