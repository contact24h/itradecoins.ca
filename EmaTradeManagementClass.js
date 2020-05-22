const { TradeManagementClass } = require("./lib/TradeManagementClass.js");

class EmaTradeManagementClass extends TradeManagementClass {
  constructor() {
    super();
    this.getData.on("newData", this.takeActionBasedOnSignal);
    this.getData.on("feedback", this.updateValuesBasedOnTradeExecution);
  }
  takeActionBasedOnSignal = data => {
    const { signal, price, vwma } = data.payload;
    //console.log("trademanagement", data);
    if (this.active) {
      if (checkStopLoss) {
        console.log("stopLoss triggered,clear all trades");
      } else if (checkTakeProfit) {
        console.log("take profit reached, clear all trades");
      } else {
        console.log("maintain trade");
        return;
      }
    } else {
      if (signal === "BUY") {
        this.active = true;
        console.log("Action : Buy and sl and tp placed");
        return;
      } else if (signal === "SELL") {
        this.active = true;
        console.log("Action : Sell and sl and tp placed");
        return;
      } else {
        console.log("do nothing");
        return;
      }
    }
  };
  updateValuesBasedOnTradeExecution = data => {
    console.log(data);
  };
}

module.exports = EmaTradeManagementClass;
