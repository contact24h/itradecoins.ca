const eventEmitter = require("events");
class TradeManagement {
  constructor() {
    this.scrip = "";
    this.active = false;
    this.processing = false;
    this.quantity = "";
    this.stopLoss = null;
    this.takeProfit = null;
    this.direction = "Long";
    this.presentPrice = null;
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
  }
  addConnector(connector) {
    this.connector = connector;
    this.getData.on("newData", this.takeActionBasedOnSignal);
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
}
module.exports = {
  TradeManagement
};
