const { transformRiskParameters } = require("../../utils/index.js");
const { TradeManagementClass } = require("../../lib/TradeManagementClass.js");

class CustomTradeManagementClass extends TradeManagementClass {
  constructor(riskParameters, filepath) {
    super(riskParameters, filepath);
    this.getData.on("newData", this.takeActionBasedOnSignal);
    this.getData.on("feedback", this.updateValuesBasedOnTradeExecution);
    this.EntryTrade = {};
    this.StopLossTrade = {};
    this.TakeProfitTrade = {};
    this.cooled = true;
    this.rp = {};
    this.gettingOutOfPreviousTrade = false;
    this.start = true;
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
  printDetails = (obj) => {
    console.log(`========================================`);
    console.log(
      `Time:${obj.Time}    signal:${obj.signal}    LastPrice:${
        obj["Last Price"]
      }    LastQuantity:${obj["Last Quantity"]}    status:${
        this.active ? "POSITION TAKEN" : "NO POSITION"
      }    side:${this.active ? this.direction : "NONE"}`
    );
    //console.log(
    //  `LastPrice:${obj["Last Price"]}    LastQuantity:${obj["Last Quantity"]}`
    //);
    //console.log(
    //  `status:${this.active ? "POSITION TAKEN" : "NO POSITION"}  side:${
    //    this.active ? this.direction : "NONE"
    //  }`
    //);
    if (this.active) {
      console.log(
        `Price:${this.EntryTrade.ap} Quantity: ${this.EntryTrade.q} SL:${this.StopLossTrade.sp} TP:${this.TakeProfitTrade.sp}`
      );
    }
  };

  takeActionBasedOnSignal = (data) => {
    //console.log("trademanagement", data);
    const { signal } = data.payload;
    //this.Logger.connection.emit("newData", data);
    this.printDetails(data.payload);

    if (this.active) {
      if (this.direction !== signal && ["BUY", "SELL"].includes(signal)) {
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
        console.log(`Action: Getting out of position as signal reversed`);
      } else {
        //code not required as binance checks stop loss
        //and take profit.
      }
    } else if (!this.active) {
      if (signal === "BUY") {
        this.active = true;
        this.rp = transformRiskParameters(this.riskParameters);
        this.direction = "BUY";
        this.quantity = this.rp.quantity;
        //console.log(`Action: BUY ${this.quantity} @ MARKET`);
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
        //console.log(`Action: Sell ${this.quantity} @MARKET`);
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
        //code must never reach here.
        return;
      }
    } else {
      //code must never reach here.
      //console.log("do nothing");
      return;
    }
  };
  updateValuesBasedOnTradeExecution = (data) => {
    //console.log("feedback received", data);
    //const printDetails = (data) => {
    //  const values = data.payload;
    //  console.log(
    //    `${values[9]} ${values[4]} ${values[7]} ${values[10]} ${values[4]} ${values[5]} ${values[8]}`
    //  );
    //};
    //printDetails(data);
    this.sendDataToLogger(
      data.raw
      //  new Date(data.payload[6]).toUTCString() +
      //    "," +
      //    data.payload.join(",") +
      //    ";"
    );
    //to place stop_loss and take_profit orders one by one.
    //updating Entry,stoploss and exit trades trades
    if (!this.gettingOutOfPreviousTrade) {
      if (data.payload[4] == "MARKET") {
        if (data.payload[3] === "NEW") {
          this.EntryTrade = { id: data.payload[1], status: "PLACED" };
        } else if (data.payload[3] === "FILLED") {
          this.EntryTrade.status = "FILLED";
          this.EntryTrade.ap = Number(data.payload[5]);
          this.EntryTrade.q = Number(data.payload[10]);
          //console.log(`new position taken: side:${this.direction}  price:${this.EntryTrade.ap} quantity:${this.EntryTrade.q}`);
          //place stop loss
          //console.log("placing stop loss");
          const side = this.direction === "BUY" ? "SELL" : "BUY";
          const price =
            this.direction === "BUY"
              ? Number(data.payload[5]) - this.rp.stopLossAmount
              : Number(data.payload[5]) + this.rp.stopLossAmount;
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
            this.StopLossTrade = {
              id: data.payload[1],
              status: "PLACED",
              sp: data.payload[8],
            };
            //console.log("stoploss placed");
            //place take Profit
            //console.log("placing take profit");
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
          console.log("stop loss is triggered");
          //  this.TakeProfitTrade.id
          //);
          this.sendDataToTradeCancellation(
            "TAKE_PROFIT_MARKET",
            this.TakeProfitTrade.id
          );
        } else if (data.payload[3] === "CANCELED") {
          this.StopLossTrade = {};
          //cancel remaining orders
          //console.log("stop loss order cancelled");
          //console.log("all trades cancelled waiting for signal");
          this.active = false;
        }
      } else if (data.payload[4] == "TAKE_PROFIT_MARKET") {
        if (data.payload[3] === "NEW") {
          if (!(data.payload[1] === this.TakeProfitTrade.id)) {
            this.TakeProfitTrade = {
              id: data.payload[1],
              status: "PLACED",
              sp: data.payload[8],
            };
            //console.log("take profit order placed");
            console.log(
              `position changed: Side:${this.direction}  Price:${this.EntryTrade.ap} Quantity:${this.EntryTrade.q} Sl:${this.StopLossTrade.sp} Tp:${this.TakeProfitTrade.sp}`
            );
          }
        } else if (data.payload[3] === "FILLED") {
          this.TakeProfitTrade = {};
          console.log("take profit was triggered");
          this.sendDataToTradeCancellation(
            "STOP_MARKET",
            this.StopLossTrade.id
          );
        } else if (data.payload[3] === "CANCELED") {
          this.TakeProfitTrade = {};
          //cancel remaining orders
          //console.log("take profit order cancelled");
          //console.log("all trades cancelled waiting for signal");
          this.active = false;
        }
      }
    } else {
      if (data.payload[4] == "MARKET") {
        if (data.payload[3] === "NEW") {
          //console.log("opposite trade initiated");
        } else if (data.payload[3] === "FILLED") {
          this.EntryTrade = {};
          //console.log("got out of present position");
          //cancel stop loss
          this.sendDataToTradeCancellation(
            "STOP_MARKET",
            this.StopLossTrade.id
          );
        }
      } else if (data.payload[4] == "STOP_MARKET") {
        if (data.payload[3] === "CANCELED") {
          this.StopLossTrade = {};
          //console.log("stop loss cancelled");
          //cancel take profit
          this.sendDataToTradeCancellation(
            "TAKE_PROFIT_MARKET",
            this.TakeProfitTrade.id
          );
        }
      } else if (data.payload[4] == "TAKE_PROFIT_MARKET") {
        if (data.payload[3] === "CANCELED") {
          this.TakeProfitTrade = {};
          //console.log("take profit order cancelled");
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
