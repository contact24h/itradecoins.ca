const { transformRiskParameters } = require("./utils/index.js");
const { TradeManagementClass } = require("./lib/TradeManagementClass.js");

class CustomTradeManagementClass extends TradeManagementClass {
  constructor(riskParameters) {
    super(riskParameters);
    this.getData.on("newData", this.takeActionBasedOnSignal);
    this.getData.on("feedback", this.updateValuesBasedOnTradeExecution);
    this.EntryTrade = {};
    this.StopLossTrade = {};
    this.TakeProfitTrade = {};
    this.cooled = true;
    this.rp = {};
    this.gettingOutOfPreviousTrade = false;
  }
  sendDataToTradePlacement = (data) => {
    const payload = data.map((d) => ({
      side: d.side,
      type: d.type,
      price: d.price ? d.price.toFixed(2) : null,
      quantity: d.quantity.toFixed(3),
    }));
    this.connector.connection.emit("newData", {
      label: "placeTrade",
      payload,
    });
  };

  sendDataToTradeCancellation = (which, id) => {
    let payload = {};
    payload.which = which;
    payload.id = id;
    this.connector.connection.emit("newData", {
      label: "cancelOrders",
      payload,
    });
  };

  takeActionBasedOnSignal = (data) => {
    console.log("trademanagement", data);
    const { signal } = data.payload;

    if (this.active && this.cooled) {
      if (this.direction !== signal) {
        //this.cooled = false;
        //setTimeout(() => {
        //  console.log("cooldown period ended");
        //  this.cooled = true;
        //}, 60000);
        //this.gettingOutOfTrades changed
        this.gettingOutOfPreviousTrade = true;

        //get out of the present  position
        this.sendDataToTradePlacement([
          {
            side: this.direction === "BUY" ? "SELL" : "BUY",
            type: "ENTRY",
            price: null,
            quantity: this.quantity,
          },
        ]);
        //close all the trades.
        //update takes care of closing other open orders
        //place the entry trade in the opposite direction.
        console.log(`Action: Got out of position cancelled all the orders`);
        //console.log("cooldown period started");
        //this.active = false;
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
        this.rp = transformRiskParameters(this.riskParameters);
        console.log(this.rp);
        this.direction = "BUY";
        this.quantity = this.rp.quantity;
        console.log(`Action: BUY ${this.quantity} @ MARKET`);
        this.sendDataToTradePlacement([
          {
            side: "BUY",
            type: "ENTRY",
            price: null,
            quantity: this.quantity,
          },
        ]);
        return;
      } else if (signal === "SELL") {
        this.active = true;
        this.rp = transformRiskParameters(this.riskParameters);
        this.direction = "SELL";
        this.quantity = this.rp.quantity;
        console.log(`Action: Sell ${this.quantity} @MARKET`);
        this.sendDataToTradePlacement([
          {
            side: "SELL",
            type: "ENTRY",
            price: null,
            quantity: this.quantity,
          },
        ]);
        return;
      } else {
        console.log("do nothing");
        return;
      }
    } else {
      console.log("do nothing");
      return;
    }
  };
  updateValuesBasedOnTradeExecution = (data) => {
    console.log("feedback received", data);
    //to place stop_loss and take_profit orders one by one.
    //updating Entry,stoploss and exit trades trades
    if (!this.gettingOutOfPreviousTrade) {
      if (data.payload[4] == "MARKET") {
        if (data.payload[3] === "NEW") {
          this.EntryTrade = { id: data.payload[1], status: "PLACED" };
        } else if (data.payload[3] === "FILLED") {
          this.EntryTrade.status = "FILLED";
          this.EntryTrade.ap = Number(data.payload[5]);
          //place stop loss
          console.log("placing stop loss");
          const side = this.direction === "BUY" ? "SELL" : "BUY";
          const price =
            this.direction === "BUY"
              ? Number(data.payload[5]) - this.rp.stopLossAmount
              : Number(data.payload[5]) + this.rp.stopLossAmount;
          console.log("send stop loss to func");
          this.sendDataToTradePlacement([
            {
              side,
              type: "STOP_MARKET",
              price,
              quantity: this.quantity,
            },
          ]);
        }
      } else if (data.payload[4] == "STOP_MARKET") {
        if (data.payload[3] === "NEW") {
          if (!(data.payload[1] === this.StopLossTrade.id)) {
            console.log(data.payload[1], this.StopLossTrade.id);
            this.StopLossTrade = { id: data.payload[1], status: "PLACED" };
            //place take Profit
            console.log("placing take profit");
            const side = this.direction === "BUY" ? "SELL" : "BUY";
            const price =
              this.direction === "BUY"
                ? Number(this.EntryTrade.ap) + this.rp.takeProfitAmount
                : Number(this.EntryTrade.ap) - this.rp.takeProfitAmount;

            this.sendDataToTradePlacement([
              {
                side,
                type: "TAKE_PROFIT_MARKET",
                price,
                quantity: this.quantity,
              },
            ]);
          }
        } else if (data.payload[3] === "FILLED") {
          this.StopLossTrade = {};
          //cancel remaining orders
          console.log("cancelling tp", this.TakeProfitTrade.id);
          this.sendDataToTradeCancellation(
            "TAKE_PROFIT_MARKET",
            this.TakeProfitTrade.id
          );
          console.log(
            "cancelling take profit  orders because stop loss was triggered"
          );
        } else if (data.payload[3] === "CANCELED") {
          this.StopLossTrade = {};
          //cancel remaining orders
          console.log("all trades cancelled waiting for signal");
          this.active = false;
        }
      } else if (data.payload[4] == "TAKE_PROFIT_MARKET") {
        if (data.payload[3] === "NEW") {
          if (!(data.payload[1] === this.TakeProfitTrade.id)) {
            this.TakeProfitTrade = { id: data.payload[1], status: "PLACED" };
          }
        } else if (data.payload[3] === "FILLED") {
          this.TakeProfitTrade = {};
          this.sendDataToTradeCancellation(
            "STOP_MARKET",
            this.StopLossTrade.id
          );
          //cancel remaining orders
          //console.log("cancel remaining orders");
          console.log(
            "cancel  stop loss  orders because take profit was triggered"
          );
        } else if (data.payload[3] === "CANCELED") {
          this.TakeProfitTrade = {};
          //cancel remaining orders
          //console.log("cancel remaining orders");
          console.log("all trades cancelled waiting for signal");
          this.active = false;
        }
      }
    } else {
      if (data.payload[4] == "MARKET") {
        if (data.payload[3] === "NEW") {
          console.log("opposite trade initiated");
        } else if (data.payload[3] === "FILLED") {
          this.EntryTrade = {};
          console.log("got out of present position");
          //cancel stop loss
          this.sendDataToTradeCancellation(
            "STOP_MARKET",
            this.StopLossTrade.id
          );
        }
      } else if (data.payload[4] == "STOP_MARKET") {
        if (data.payload[3] === "CANCELED") {
          this.StopLossTrade = {};
          console.log("stop loss cancelled");
          //cancel take profit
          this.sendDataToTradeCancellation(
            "TAKE_PROFIT_MARKET",
            this.TakeProfitTrade.id
          );
        }
      } else if (data.payload[4] == "TAKE_PROFIT_MARKET") {
        if (data.payload[3] === "CANCELED") {
          this.TakeProfitTrade = {};
          console.log("take profit order cancelled");
          //cancel take profit
          this.TakeProfitTrade = {};
          this.gettingOutOfPreviousTrade = false;
          //place the trade in the opposite direction.
          this.direction = this.direction === "BUY" ? "SELL" : "BUY";
          this.sendDataToTradePlacement([
            {
              side: this.direction,
              type: "ENTRY",
              price: null,
              quantity: this.quantity,
            },
          ]);
        }
      }
    }
  };
}

module.exports = CustomTradeManagementClass;
