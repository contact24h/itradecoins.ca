const { transformRiskParameters } = require("./utils/index.js");
const { TradeManagementClass } = require("./lib/TradeManagementClass.js");

class EmaTradeManagementClass extends TradeManagementClass {
  constructor(riskParameters) {
    super(riskParameters);
    this.getData.on("newData", this.takeActionBasedOnSignal);
    this.getData.on("feedback", this.updateValuesBasedOnTradeExecution);
  }
  sendDataToTradePlacement = data => {
    const payload = data.map(d => ({
      side: d.side,
      type: d.type,
      price: d.price,
      quantity: d.quantity
    }));
    this.connector.connection.emit("newData", {
      label: "placeTrade",
      payload
    });
  };
  sendDataToTradeCancellation = which => {
    let payload;
    if (which === "all") {
      payload = {
        which: "all",
        quantity: this.quantity,
        side: this.direction === "BUY" ? "SELL" : "BUY",
        type: "MARKET"
      };
    } else {
      payload = { which };
    }
    this.connector.connection.emit("newData", {
      label: "cancelOrders",
      payload
    });
  };
  takeActionBasedOnSignal = data => {
    const { signal, price, vwma } = data.payload;
    //console.log("trademanagement", data);
    if (this.active && this.cooled) {
      if (this.direction !== signal) {
        this.cooled = false;
        setTimeout(() => {
          console.log("cooldown period ended");
          this.cooled = true;
        }, 60000);
        this.sendDataToTradeCancellation("all");
        console.log(`Action: Got out of position cancelled all the orders`);
        console.log("cooldown period started");
        this.active = false;
      } else {
        //code not required as binance checks stop loss
        //and take profit.
        //if (this.checkStopLoss()) {
        //  console.log("stopLoss triggered,clear all trades");
        //  this.active = false;
        //} else if (this.checkTakeProfit()) {
        //  console.log("take profit reached, clear all trades");
        //  this.active = false;
        //} else {
        //  return;
        //}
      }
    } else if (this.cooled && !this.active) {
      if (signal === "BUY") {
        this.active = true;
        const rp = transformRiskParameters(price, this.riskParameters);
        console.log(rp);
        this.direction = "BUY";
        this.quantity = rp.quantity;
        this.presentPrice = price;
        this.stopLoss = this.presentPrice - rp.stopLossAmount;
        this.takeProfit = this.presentPrice + rp.takeProfitAmount;
        console.log(
          `Action: Buy ${this.quantity} @${this.presentPrice}; stoploss: ${this.stopLoss} and takeProfit: ${this.takeProfit}`
        );
        this.sendDataToTradePlacement([
          {
            side: "BUY",
            type: "ENTRY",
            price: this.presentPrice,
            quantity: this.quantity
          },
          {
            side: "SELL",
            type: "STOP_MARKET",
            price: this.stopLoss,
            quantity: this.quantity
          },
          {
            side: "SELL",
            type: "TAKE_PROFIT_MARKET",
            price: this.takeProfit,
            quantity: this.quantity
          }
        ]);
        return;
      } else if (signal === "SELL") {
        this.active = true;
        const rp = transformRiskParameters(price, this.riskParameters);
        this.direction = "SELL";
        this.quantity = rp.quantity;
        this.presentPrice = price;
        this.stopLoss = this.presentPrice + rp.stopLossAmount;
        this.takeProfit = this.presentPrice - rp.takeProfitAmount;
        //trailForEach
        console.log(
          `Action: Sell ${this.quantity} @${this.presentPrice}; stoploss: ${this.stopLoss} and takeProfit: ${this.takeProfit}`
        );
        this.sendDataToTradePlacement([
          {
            side: "SELL",
            type: "ENTRY",
            price: this.presentPrice,
            quantity: this.quantity
          },
          {
            side: "BUY",
            type: "STOP_MARKET",
            price: this.stopLoss,
            quantity: this.quantity
          },
          {
            side: "BUY",
            type: "TAKE_PROFIT_MARKET",
            price: this.takeProfit,
            quantity: this.quantity
          }
        ]);
        return;
      } else {
        console.log("do nothing");
        return;
      }
    }
  };
  updateValuesBasedOnTradeExecution = data => {
    //console.log("feedback received", data);
    if (data.payload[2] === "FILLED" || data.payload[3] === "FILLED") {
      if (data.payload[4] === "STOP_MARKET") {
        this.sendDataToTradeCancellation("TAKE_PROFIT_MARKET");
      } else if (data.payload[4] === "TAKE_PROFIT_MARKET") {
        this.sendDataToTradeCancellation("STOP_MARKET");
      }
    }
  };
}

module.exports = EmaTradeManagementClass;
