class TradingStrategyClass {
  constructor(parameters, modules) {
    //parameters
    this.symbol = parameters.symbol;
    this.tradingStrategyName = parameters.tradingStrategyName;
    this.filepath = parameters.filepath;
    this.userStream = parameters.userStream;
    this.OrderAPI = parameters.OrderAPI;
    this.binanceWebsocketURL = parameters.binanceWebsocketURL;
    this.binanceRESTEndPoint = parameters.binanceRESTEndPoint;
    this.binanceAPI = parameters.binanceAPI;
    this.binanceSecret = parameters.binanceSecret;
    this.subscription1 = parameters.subscription1;
    this.subscription2 = parameters.subscription2;
    this.riskParameters = parameters.riskParameters;
    //modules
    this.DataPipeWebSocket = modules.DataPipeWebSocket;
    this.DataPipeREST = modules.DataPipeREST;
    this.SignalGeneratorClass = modules.SignalGeneratorClass;
    this.TradeManagementClass = modules.TradeManagementClass;
    this.TradePlacementClass = modules.TradePlacementClass;
    this.Logger = modules.LoggerClass;
    this.Connector = modules.Connector;
    //variables used during execution
    this.wp = null;
    this.rp = null;
    this.sg = null;
    this.tm = null;
    this.tp = null;
    this.lg = null;
    //create connectors
    this.dataToSignalConnector = null;
    this.SignalGeneratorToTradeManagement = null;
    this.TradeMangementToTradePlacement = null;
    this.TradePlacementToLogger = null;
    //feedback connector
    this.TradePlacementToTradeManagement = null;
  }

  initializeClasses = () => {
    this.wp = new this.DataPipeWebSocket(this.binanceWebsocketURL);
    //this.wp.subscribe(this.subscription1);
    this.rp = new this.DataPipeREST(this.binanceRESTEndPoint);
    //create SignalGenerators
    this.sg = new this.SignalGeneratorClass();
    //create TradeManagement
    this.tm = new this.TradeManagementClass(this.riskParameters, this.filepath);
    //create TradePlacement
    this.tp = new this.TradePlacementClass(
      this.symbol,
      this.binanceAPI,
      this.binanceSecret,
      this.OrderAPI,
      this.userStream
    );
    //create Logger
    this.lg = new this.Logger(this.filepath);
  };

  initializeConnectors = () => {
    //create connectors
    this.dataToSignalConnector = new this.Connector();
    this.SignalGeneratorToTradeManagement = new this.Connector();
    this.TradeMangementToTradePlacement = new this.Connector();
    this.TradePlacementToLogger = new this.Connector();
    //feedback connector
    this.TradePlacementToTradeManagement = new this.Connector();
  };

  connectConnectorsToDestination = () => {
    this.dataToSignalConnector.connectTarget(this.sg);
    this.SignalGeneratorToTradeManagement.connectTarget(this.tm);
    this.TradeMangementToTradePlacement.connectTarget(this.tp);
    this.TradePlacementToLogger.connectTarget(this.lg);
    this.TradePlacementToTradeManagement.connectFeedbackTarget(this.tm);
  };

  connectConnectorsToSource = () => {
    this.rp.addConnector(this.dataToSignalConnector);
    this.sg.addConnector(this.SignalGeneratorToTradeManagement);
    this.tm.addConnector(this.TradeMangementToTradePlacement);
    //added to the class itself
    //this.tm.addLogger(this.TradePlacementToLogger);
    this.tp.addConnector(this.TradePlacementToLogger);
    this.tp.addFeedbackConnector(this.TradePlacementToTradeManagement);
  };

  startStrategy = () => {
    this.initializeClasses();
    this.initializeConnectors();
    this.connectConnectorsToDestination();
    this.connectConnectorsToSource();
    //start the strategy
    setTimeout(() => {
      this.rp.repeatGetKlinesAndStreamtoConnectorForEachInterval(
        "1m",
        "BTCUSDT"
      );
    }, 5000);
  };
}

module.exports = {
  TradingStrategyClass,
};
