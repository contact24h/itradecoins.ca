const { transformRiskParameters } = require("./utils/index.js");
//parameter for the trading strategy
const symbol = "BTCUSDT";
const tradingStrategyName = "testStrategy";
//const binanceWebsocketURL = "wss://dex.binance.org/api/ws";
//const binanceWebsocketURL = "wss://testnet-dex.binance.org/api/ws";
//const binanceWebsocketURL = "wss:/stream.binance.com:9443/ws";
const binanceWebsocketURL = "wss://fstream.binance.com/ws";
const binanceRESTEndPoint = "https://api.binance.com";
const binanceAPI =
  "PwQrIzSawH99n7pWd2Tuz1vP7hxbW2zLFIs52KvUr9gddFyauPJKca3j2yYrpxyM";
const binanceSecret =
  "BkGX68Cq0CDKfklI407NRxqBWH5xd0v5kBr89zdX4iVwNp5wZbkaSKeKMeLN72MR";
const subscription1 = {
  method: "SUBSCRIBE",
  params: ["btcusdt@aggTrade"],
  id: 1
};
const subscription2 = {
  method: "SUBSCRIBE",
  params: ["btcusdt@kline_1m"],
  id: 2
};

//trade Mangement
const riskParameters = {
  unit: "percentage",
  riskPerTrade: 10,
  profitPerTrade: 10,
  trailForEach: 5
};
//console.log(transformRiskParameters(150, riskParameters));

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
  riskParameters
};
