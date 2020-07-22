const eventEmitter = require("events");
class TradeManagementClass {
  constructor(riskParameters) {
    //this.scrip = scrip;
    this.active = false;
    //this.processing = false;
    this.quantity = 0;
    this.riskPerTrade = 0;
    this.stopLoss = null;
    this.takeProfit = null;
    this.direction = null;
    this.presentPrice = null;
    this.riskParameters = riskParameters;
    this.getData = new eventEmitter();
    this.cooled = true;
    //this.getData.on("newData", this.takeActionBasedOnSignal);
    //this.getData.on("feedback", this.updateValuesBasedOnTradeExecution);
  }

  addConnector = (connector) => {
    this.connector = connector;
    //this.getData.on("newData", this.takeActionBasedOnSignal);
    //this.getData.on("updateData", this.updateValuesBasedOnTradeExecution);
  };

  initializeTrade = (price, direction) => {
    this.active = true;
    this.quantity = price / this.riskPerTrade;
    this.direction = direction;
    if (direction === "BUY") {
      this.stopLoss = price - this.riskPerTrade;
    } else {
      this.stopLoss = price + this.riskPerTrade;
    }
  };

  checkStopLoss = () => {
    if (this.active) {
      if ((this.direction = "BUY")) {
        return this.presentPrice <= this.stopLoss;
      } else {
        return this.presentPrice >= this.stopLoss;
      }
    }
  };

  checkTakeProfit = () => {
    if (this.active) {
      if ((this.direction = "BUY")) {
        return this.presentPrice >= this.takeProfit;
      } else {
        return this.presentPrice <= this.takeProfit;
      }
    }
  };

  checkQuantity = () => {
    return this.quantity;
  };

  checkTradeStatus = () => {
    return this.active;
  };

  updateTakeProfit = (newLevel) => {
    this.takeProfit = newLevel;
  };

  updateStopLoss = (newLevel) => {
    this.stopLoss = newLevel;
  };

  updateQuanity = (newQuantity) => {
    this.quantity = newQuantity;
  };

  updateTradeStatus = (active) => {
    this.active = active;
  };

  takeActionBasedOnSignal = (data) => {
    console.log("action based on signal", "noAction", data);
    //this.connector.connection.emit("newData", { action: "noAction" });
    //console.log(signal, data);
  };
  updateValuesBasedOnTradeExecution = (result) => {
    console.log(result);
  };
}
module.exports = {
  TradeManagementClass,
};
