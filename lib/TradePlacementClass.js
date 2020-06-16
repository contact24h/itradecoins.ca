const eventEmitter = require("events");
const webSocket = require("ws");
const {
  placeOrder,
  cancelOrder,
  convertIntoOrderParams,
  startUserDataStream,
  listenKey
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
    //this.getData.on("newData", this.action);
    this.getData.on("newData", this.action);
    this.stopLoss = "";
    this.trade = "";
    this.takeProfit = "";
    this.userWebSocket;
    //listenKey("GET")
    //  .then(value => {
    //    console.log("hi", userStream + value.listenKey);
    //    this.userWebSocket = new webSocket(`${userStream}${listenKey}`);
    //    this.userWebSocket.on("open", () => {
    //      console.log("websocket opened");
    //    });
    //    this.userWebSocket.on("error", err => {
    //      console.log(err.message);
    //    });
    //    this.userWebSocket.on("message", this.actOnUserWebsocketStream);
    //  })
    //  .catch(err => console.log(err.message));
    startUserDataStream()
      .then(ee => {
        this.userWebSocket = ee;
        //console.log("ee", this.userWebSocket);
        this.userWebSocket.on("message", this.actOnUserWebsocketStream);
      })
      .catch(err => console.log(err.message));
  }

  actOnUserWebsocketStream = data => {
    const d = JSON.parse(data);
    if (d.e === "ORDER_TRADE_UPDATE") {
      console.log("order update", d.e, d.o.i, d.o.x, d.o.X, d.o.ot);
      this.feedbackConnector.connection.emit("feedback", {
        label: "ORDER_UPDATE",
        payload: [d.e, d.o.i, d.o.x, d.o.X, d.o.ot]
      });
    }
  };

  addConnector = connector => {
    this.connector = connector;
  };

  addFeedbackConnector = connector => {
    this.feedbackConnector = connector;
  };

  addConnector = connector => {
    this.connector = connector;
    //this.getData.on("newData", this.takeActionBasedOnSignal);
    //this.getData.on("updateData", this.updateValuesBasedOnTradeExecution);
  };

  pushDataToConnector = data => {
    //console.log("ps", data);
    this.connector.connection.emit("newData", {
      label: "traded",
      payload: data
    });
    this.feedbackConnector.connection.emit("feedback", {
      label: "traded",
      payload: data
    });
  };

  action = data => {
    if (data.label === "placeTrade") {
      const { side, type, quantity, price } = data.payload;
      console.log(side, type, quantity, price);
      let params = {};
      if (data.payload.type === "ENTRY") {
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
      placeOrder(params).then(data => {
        this[data.type] = data["orderId"];
        //console.log(data);
        this.pushDataToConnector(data);
      });
    } else if (data.label === "cancelOrders") {
      if (data.payload.which === "all") {
        const { side, type, quantity } = data.payload;
        const params = convertIntoOrderParams(
          symbol,
          side,
          type,
          null,
          quantity,
          null,
          null
        );
        placeOrder(params).then(data => {
          this[data.type] = null;
          this.pushDataToConnector(data);
        });
        cancelOrder(symbol, this.STOP_MARKET)
          .then(() => {
            this[STOP_MARKET] = null;
          })
          .catch(err => console.log(err.message));
        cancelOrder(symbol, this.TAKE_PROFIT_MARKET)
          .then(() => {
            this[TAKE_PROFIT_MARKET] = null;
          })
          .catch(err => console.log(err.message));
      } else if (data.payload.which === "STOP_MARKET") {
        cancelOrder(symbol, this.STOP_MARKET)
          .then(() => {
            this[STOP_MARKET] = null;
          })
          .catch(err => console.log(err.message));
      } else if (data.payload.which === "TAKE_PROFIT_MARKET") {
        cancelOrder(symbol, this.TAKE_PROFIT_MARKET)
          .then(() => {
            this[TAKE_PROFIT_MARKET] = null;
          })
          .catch(err => console.log(err.message));
      }
    }
  };
}
module.exports = {
  TradePlacementClass
};
