const eventEmitter = require("events");
export class TradingManagement {
  constructor() {
    this.scrip = "";
    this.active = false;
    this.processing = false;
    this.quantity = "";
    this.stopLoss = null;
    this.takeProfit = null;
    this.direction = "Long";
    this.presentPrice = null;
    this.getDataEvents = new eventEmitter();
    this.getDataEvents.on("newData", this.takeActionBasedOnSignal);
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
  takeActionBasedOnSignal(signal, data) {
    console.log(singal, data);
  }
}
module.exports = {
  TradingManagement
};
