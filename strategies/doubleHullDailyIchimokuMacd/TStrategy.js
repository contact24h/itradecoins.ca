const { Connector } = require("./lib/ConnectorClass.js");
const { DataPipeWebSocket, DataPipeREST } = require("./lib/DataPipeClass.js");
const CustomSignalGeneratorClass = require("./CustomSignalGeneratorClass.js");
const CustomTradeManagementClass = require("./CustomTradeManagementClass.js");
const { TradePlacementClass } = require("./lib/TradePlacementClass.js");
const { Logger } = require("./lib/LoggerClass.js");
//const tulind = require("tulind");
const parameters = require("./parameters.js");
const { TradingStrategyClass } = require("./lib/TradingStrategyClass.js");

const TradingStrategy = new TradingStrategyClass(parameters, {
  Connector,
  DataPipeWebSocket,
  DataPipeREST,
  SignalGeneratorClass: CustomSignalGeneratorClass,
  TradeManagementClass: CustomTradeManagementClass,
  TradePlacementClass,
  LoggerClass: Logger,
});

TradingStrategy.startStrategy();
