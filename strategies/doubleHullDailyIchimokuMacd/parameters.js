const { transformRiskParameters } = require("./utils/index.js");
//parameter for the trading strategy
const symbol = "BTCUSDT";
const tradingStrategyName = "";
//const binanceWebsocketURL = "wss://dex.binance.org/api/ws";
//const binanceWebsocketURL = "wss://testnet-dex.binance.org/api/ws";
//const binanceWebsocketURL = "wss:/stream.binance.com:9443/ws";
const binanceWebsocketURL = "wss://fstream.binance.com/ws";
const binanceRESTEndPoint = "https://api.binance.com";

//replace the below api and secret with your data.
const binanceAPI =
  "600044b043eedb449917d9020724b9e9855297a93c7b6fb92f64704cae633a17";
const binanceSecret =
  "b0589308d947920a6a0eb66f13e992d234e5b9943edd9d1d364f8e8f2b4dbb87";

//testnet for testing if you plan to go real use  real api end point here.
const OrderAPI = "https://testnet.binancefuture.com";
const userStream = "wss://stream.binancefuture.com/ws/";
const subscription1 = {
  method: "SUBSCRIBE",
  params: ["btcusdt@aggTrade"],
  id: 1,
};
const subscription2 = {
  method: "SUBSCRIBE",
  params: ["btcusdt@kline_1m"],
  id: 2,
};

//trade Management
const riskParameters = {
  unit: "normal",
  portfolio: 10000,
  riskPerTrade: 1, //percent per portfolio to be risked
  stopLossAmount: 50, //in dollars risk per trade
  takeProfitAmount: 1000, //in dollars profit per trade
  trailForEach: 0.5, //  to be implemented.percent increase in price and
};

//Logger
const filepath = "./" + tradingStrategyName + ".log.txt";

module.exports = {
  symbol,
  tradingStrategyName,
  filepath,
  binanceWebsocketURL,
  binanceRESTEndPoint,
  binanceAPI,
  binanceSecret,
  subscription1,
  subscription2,
  riskParameters,
  userStream,
  OrderAPI,
};
