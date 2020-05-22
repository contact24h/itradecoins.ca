const { Connector } = require("./lib/ConnectorClass.js");
const { DataPipeWebSocket, DataPipeREST } = require("./lib/DataPipeClass.js");
const EmaSignalGeneratorClass = require("./EmaSignalGeneratorClass.js");
const EmaTradeManagementClass = require("./EmaTradeManagementClass.js");
const { TradeManagementClass } = require("./lib/TradeManagementClass.js");
const { TradePlacement } = require("./lib/TradePlacementClass.js");
const { Logger } = require("./lib/LoggerClass.js");
const tulind = require("tulind");

const {
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
} = require("./parameters.js");
//create data streams
const wp = new DataPipeWebSocket(binanceWebsocketURL);
wp.subscribe(subscription1);
const rp = new DataPipeREST(binanceRESTEndPoint);
//create SignalGenerators
const sg = new EmaSignalGeneratorClass();
//create TradeManagement
const tm = new EmaTradeManagementClass();

//create connectors
const dataToSignalConnector = new Connector();
const SignalGeneratorToTradeManagement = new Connector();

//connect connectors to Destination
dataToSignalConnector.connectTarget(sg);
SignalGeneratorToTradeManagement.connectTarget(tm);

//connect connectors to Sources
wp.addConnector(dataToSignalConnector);
rp.addConnector(dataToSignalConnector);
sg.addConnector(SignalGeneratorToTradeManagement);

//starting "1m historical data"
rp.repeatGetKlinesAndStreamtoConnectorForEachInterval("1m", "BTCUSDT");
