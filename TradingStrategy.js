const { Connector } = require("./ConnectorClass.js");
const { DataPipeWebSocket, DataPipeREST } = require("./DataPipeClass.js");
const { SignalGenerator } = require("./SignalGeneratorClass.js");
const { TradeManagement } = require("./TradeManagementClass.js");
const { TradePlacement } = require("./TradePlacementClass.js");
const { Logger } = require("./LoggerClass.js");

const tulind = require("tulind");

//parameter for the trading strategy
const symbol = "BTCUSDT";
const tradingStrategyName = "testStrategy";
const filepath = "./" + tradingStrategyName + ".log.txt";
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
//create connectors
//create data to signal connector
const dataToSignalConnector = new Connector();
//create signal to trade management connector
const signalToTradeManagement = new Connector();
//create tradeManagement to tradePlacement connector
const tradeManagementTotradePlacement = new Connector();
//create tradePlacement to logger connector,
const tradePlacementToLogger = new Connector();

//create data streams
const wp = new DataPipeWebSocket(binanceWebsocketURL);
const rp = new DataPipeREST(binanceRESTEndPoint);

//create new signal generator
const sg = new SignalGenerator();
//create new trade management
const tm = new TradeManagement(50, 100, 10);
//create new trade placement
const tp = new TradePlacement();
//create new logger
const lg = new Logger(filepath);
//

//signal generation
sg.vwma = undefined;
sg.signal = "None";
sg.generateSignal = function({ payload, label }) {
  //console.log(label);
  sg.updatedData[label] = payload;
  //console.log("signal", this.signal);
  if (label === "klines1m") {
    let temp = sg.updatedData.klines1m.slice(450);
    let close = temp.map(e => Number(e[4]));
    let volume = temp.map(e => Number(e[5]));
    //console.log(temp, close, volume);
    tulind.indicators.vwma.indicator([close, volume], [15], function(
      err,
      results
    ) {
      if (err) {
        console.log(err.message);
        return;
      }
      sg.vwma = Number(results[0][results[0].length - 1].toFixed(2));
      //console.log(sg.vwma);
      return;
    });
    //console.log(
    //  index,
    //  label,
    //  new Date(data[data.length - 1][0]).toTimeString(),
    //  data[data.length - 1][4]
    //);
  } else if (label === "price") {
    //console.log(sg);
    if (sg.vwma && payload.p) {
      if (sg.vwma < Number(payload.p)) {
        sg.signal = "Buy";
      } else {
        sg.signal = "Sell";
      }
      //console.log(
      //  new Date(payload.E).toTimeString().split(" ")[0],
      //  " ",
      //  sg.vwma,
      //  " ",
      //  payload.p,
      //  " ",
      //  sg.signal
      //);
    }
  }
  try {
    sg.connector.connection.emit("newData", {
      label: "signal",
      payload: {
        signal: sg.signal,
        vwma: sg.vwma,
        price: sg.updatedData.price ? Number(sg.updatedData.price.p) : null
      }
    });
  } catch (err) {
    console.log(err.message);
  }
};
//sg.getData.on("newData", sg.generateSignal);
tm.intervalBetweenSignals = 6000;
tm.takeActionBasedOnSignal = function({ label, payload }) {
  //console.log("action based on signal", "noAction");
  console.log(label, payload);
  tm.presentPrice = payload.price;
  if (tm.active) {
    //check if stop 	loss is hit
    if (tm.checkStopLoss()) {
      //check if take profit is hit
      //if not reached, check the price, if it is greater than  the previous
      //high/loww trail the stop loss
    }
  } else {
    tm.initializeTrade(payload.price, payload.signal);
    this.connector.connection.emit("newdata", {
      label: "tradeinitialize",
      payload: [{}, {}, {}]
    });
  }
};

//connect the connectors to their respective targets
dataToSignalConnector.connectTarget(sg);
signalToTradeManagement.connectTarget(tm);
tradeManagementTotradePlacement.connectTarget(tp);
tradePlacementToLogger.connectTarget(lg);

//connect connectors to their respective origins
tp.addConnector(tradePlacementToLogger);
tm.addConnector(tradeManagementTotradePlacement);
tm.getData.on("newData", tm.takeActionBasedOnSignal);
sg.addConnector(signalToTradeManagement);
wp.addConnector(dataToSignalConnector);
wp.subscribe(subscription1);
rp.addConnector(dataToSignalConnector);
rp.repeatGetKlinesAndStreamtoConnectorForEachInterval("1m", "BTCUSDT");
