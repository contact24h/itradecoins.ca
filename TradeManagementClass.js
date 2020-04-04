const eventEmitter = require("events");
class TradeManagement {
  constructor(scrip, riskPerTrade, profitPerTrade, trailForEach) {
    this.scrip = scrip;
    this.active = false;
    this.processing = false;
    this.quantity = "";
    this.riskPerTrade = 0;
    this.stopLoss = null;
    this.takeProfit = null;
    this.direction = null;
    this.presentPrice = null;
    this.riskPerTrade = riskPerTrade;
    this.profitPerTrade = profitPerTrade;
    this.trailForEach = trailForEach;
    this.getData = new eventEmitter();
    this.addConnector = this.addConnector.bind(this);
    this.checkStopLoss = this.checkStopLoss.bind(this);
    this.checkTakeProfit = this.checkTakeProfit.bind(this);
    this.checkQuantity = this.checkQuantity.bind(this);
    this.checkTradeStatus = this.checkTradeStatus.bind(this);
    this.updateTakeProfit = this.updateTakeProfit.bind(this);
    this.updateStopLoss = this.updateStopLoss.bind(this);
    this.updateQuanity = this.updateQuanity.bind(this);
    this.updateTradeStatus = this.updateTradeStatus.bind(this);
    this.takeActionBasedOnSignal = this.takeActionBasedOnSignal.bind(this);
    this.updateValuesBasedOnTradeExecution = this.updateValuesBasedOnTradeExecution.bind(
      this
    );
  }
  initializeTrade(price, direction) {
    this.active = true;
    this.quantity = price / this.riskPerTrade;
    this.direction = direction;
    if (direction === "Buy") {
      this.stopLoss = price - this.riskPerTrade;
    } else {
      this.stopLoss = price + this.riskPerTrade;
    }
  }
  addConnector(connector) {
    this.connector = connector;
    this.getData.on("newData", this.takeActionBasedOnSignal);
    this.getData.on("updateData", this.updateValuesBasedOnTradeExecution);
  }

  checkStopLoss() {
    if (this.active) {
      if ((this.direction = "Long")) {
        return this.presentPrice <= this.stopLoss;
      } else {
        return this.presentPrice >= this.stopLoss;
      }
    }
  }
  checkTakeProfit() {
    if (this.active) {
      if ((this.direction = "Long")) {
        return this.presentPrice >= this.takeProfit;
      } else {
        return this.presentPrice <= this.takeProfit;
      }
    }
  }
  checkQuantity() {
    return this.quantity;
  }
  checkTradeStatus() {
    return this.active;
  }
  updateTakeProfit(newLevel) {
    this.takeProfit = newLevel;
  }
  updateStopLoss(newLevel) {
    this.stopLoss = newLevel;
  }
  updateQuanity(newQuantity) {
    this.quantity = newQuantity;
  }
  updateTradeStatus(active) {
    this.active = active;
  }

  takeActionBasedOnSignal({ signal, data }) {
    console.log("action based on signal", "noAction");
    this.connector.connection.emit("newData", { action: "noAction" });
    //console.log(signal, data);
  }
  updateValuesBasedOnTradeExecution(result) {
    if (result.data === false) {
      console.log("dont update values");
    } else {
      console.log("update values");
    }
  }
}
module.exports = {
  TradeManagement
};
