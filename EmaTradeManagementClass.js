const { transformRiskParameters } = require("./utils/index.js");
const { TradeManagementClass } = require("./lib/TradeManagementClass.js");

class EmaTradeManagementClass extends TradeManagementClass {
  constructor(riskParameters) {
    super(riskParameters);
    this.getData.on("newData", this.takeActionBasedOnSignal);
    this.getData.on("feedback", this.updateValuesBasedOnTradeExecution);
  }
  sendDataToTradePlacement = (action, price, quantity) => {
    this.connector.connection.emit("newData", {
      label: "action",
      payload: {
        action,
        price,
        quantity
      }
    });
  };
  takeActionBasedOnSignal = data => {
    const { signal, price, vwma } = data.payload;
    //console.log("trademanagement", data);
    if (this.active) {
      if (this.checkStopLoss()) {
        console.log("stopLoss triggered,clear all trades");
        this.active = false;
      } else if (this.checkTakeProfit()) {
        console.log("take profit reached, clear all trades");
        this.active = false;
      } else {
        //console.log("Action : maintain trade");
        //console.log(
        //  `Buy ${this.quantity} @${this.presentPrice}; stoploss: ${this.stopLoss} and takeProfit: ${this.takeProfit}`
        //);

        return;
      }
    } else {
      if (signal === "BUY") {
        this.active = true;
        const rp = transformRiskParameters(price, this.riskParameters);
        console.log(rp);
        this.direction = "BUY";
        this.quantity = rp.quantity;
        this.presentPrice = price;
        this.stopLoss = this.presentPrice - rp.riskPerTrade;
        this.takeProfit = this.presentPrice + rp.profitPerTrade;
        //this.trailForEach = rp.trailForEach;
        console.log(
          `Action: Buy ${this.quantity} @${this.presentPrice}; stoploss: ${this.stopLoss} and takeProfit: ${this.takeProfit}`
        );
        this.sendDataToTradePlacement("BUY", this.presentPrice, this.quantity);
        return;
      } else if (signal === "SELL") {
        this.active = true;
        const rp = transformRiskParameters(price, this.riskParameters);
        this.direction = "BUY";
        this.quantity = rp.quantity;
        this.presentPrice = price;
        this.stopLoss = this.presentPrice - rp.riskPerTrade;
        this.takeProfit = this.presentPrice + rp.profitPerTrade;
        //trailForEach
        console.log(
          `Action: Sell ${this.quantity} @${this.price}; stoploss: ${this.stopLoss} and takeProfit: ${this.takeProfit}`
        );
        this.sendDataToTradePlacement("SELL", this.price, this.quantity);
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
