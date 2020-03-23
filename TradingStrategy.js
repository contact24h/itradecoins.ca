const { Connector } = require("./ConnectorClass.js");
const { DataPipeWebSocket } = require("./DataPipeClass.js");
const { SignalGenerator } = require("./SignalGeneratorClass.js");
const { TradeManagement } = require("./TradeManagementClass.js");
const { TradePlacement } = require("./TradePlacementClass.js");
const { Logger } = require("./LoggerClass.js");
const subscription1 = { op: "subscribe", args: ["trade"] };

//parameter for the trading strategy

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
const wp = new DataPipeWebSocket(
  0,
  "wss://stream.bybit.com/realtime",
  subscription1
);
const wp1 = new DataPipeWebSocket(
  1,
  "wss://stream.bybit.com/realtime",
  subscription1
);
//create new signal generator
const sg = new SignalGenerator();
//create new trade management
const tm = new TradeManagement();
//create new trade placement
const tp = new TradePlacement();
//create new logger
const lg = new Logger();

//connect the connectors to their respective targets
dataToSignalConnector.connectTarget(sg);
signalToTradeManagement.connectTarget(tm);
tradeManagementTotradePlacement.connectTarget(tp);
tradePlacementToLogger.connectTarget(lg);

//connect connectors to their respective origins
tp.addConnector(tradePlacementToLogger);
tm.addConnector(tradeManagementTotradePlacement);
sg.addConnector(signalToTradeManagement);
wp.addConnector(dataToSignalConnector);
wp1.addConnector(dataToSignalConnector);
