const eventEmitter = require("events");
const webSocket = require("ws");
const {
  placeOrder,
  cancelOrder,
  convertIntoOrderParams,
  startUserDataStream,
  listenKey,
} = require("../utils/index.js");

const { symbol, userStream, OrderAPI } = require("../parameters.js");
class TradePlacementClass {
  constructor() {
    this.url = "";
    this.authentication = {};
    this.getData = new eventEmitter();
    this.connector = null;
    this.feedbackConnector = null;
    this.addConnector = this.addConnector.bind(this);
    this.action = this.action.bind(this);
    this.getData.on("newData", this.action);
    this.stopLoss = "";
    this.trade = "";
    this.takeProfit = "";
    this.userWebSocket = null;
    this.orderEmitter = new eventEmitter();
    startUserDataStream()
      .then((ee) => {
        this.userWebSocket = ee;
        this.userWebSocket.on("message", this.actOnUserWebsocketStream);
      })
      .catch((err) => console.log(err.message));
  }

  actOnUserWebsocketStream = (data) => {
    const d = JSON.parse(data);
    //console.log(d);
    if (d.e === "ORDER_TRADE_UPDATE") {
      //console.log("order update", d.e, d.o.i, d.o.x, d.o.X, d.o.ot, d.o.ap);
      this.feedbackConnector.connection.emit("feedback", {
        label: "ORDER_UPDATE",
        payload: [d.e, d.o.i, d.o.x, d.o.X, d.o.ot, d.o.ap],
      });
    }
  };

  addConnector = (connector) => {
    this.connector = connector;
  };

  addFeedbackConnector = (connector) => {
    this.feedbackConnector = connector;
  };

  addConnector = (connector) => {
    this.connector = connector;
  };

  pushDataToConnector = (data) => {
    this.connector.connection.emit("newData", {
      label: "traded",
      payload: data,
    });
    //this.feedbackConnector.connection.emit("feedback", {
    //  label: "traded",
    //  payload: data,
    //});
  };

  action(data) {
    if (data.label === "placeTrade") {
      const paramData = data.payload.map((datum) => {
        const { side, type, quantity, price } = datum;
        console.log(side, type, quantity, price);
        let params = {};
        if (type === "ENTRY") {
          params = convertIntoOrderParams(
            symbol,
            side,
            "MARKET",
            null,
            quantity,
            null,
            null
          );
        } else {
          params = convertIntoOrderParams(
            symbol,
            side,
            type,
            null,
            quantity,
            price,
            null
          );
        }
        return params;
      });
      //console.log("placing order");
      //console.log(paramData[0]);
      placeOrder(paramData[0]);
      //this.orderEmitter.emit("placeOrders", paramData);
    } else if (data.label === "cancelOrders") {
      if (data.payload.which === "STOP_MARKET") {
        cancelOrder(symbol, data.payload.id).catch((err) =>
          console.log(err.message)
        );
      } else if (data.payload.which === "TAKE_PROFIT_MARKET") {
        cancelOrder(symbol, data.payload.id).catch((err) =>
          console.log(err.message)
        );
      }
    }
  }
}
module.exports = {
  TradePlacementClass,
};
