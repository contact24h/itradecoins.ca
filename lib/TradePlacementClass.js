const eventEmitter = require("events");
const webSocket = require("ws");
const {
  placeOrder,
  cancelOrder,
  convertIntoOrderParams,
  startUserDataStream,
  //listenKey,
} = require("../utils/index.js");
//const {
//  symbol,
//  binanceAPI,
//  binanceSecret,
//  OrderAPI,
//  userStream,
//} = require("../parameters.js");

class TradePlacementClass {
  constructor(symbol, binanceAPI, binanceSecret, OrderAPI, userStream) {
    this.symbol = symbol;
    this.binanceAPI = binanceAPI;
    this.binanceSecret = binanceSecret;
    this.OrderAPI = OrderAPI;
    this.userStream = userStream;

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

    //console.log("hi", this.userStream, this.OrderAPI);
    startUserDataStream(this.userStream, this.OrderAPI, this.binanceAPI)
      .then((ee) => {
        this.userWebSocket = ee;
        this.userWebSocket.on("message", this.actOnUserWebsocketStream);
      })
      .catch((err) => console.log(err.message));
  }

  //listener for user data stored events
  //sends the result of trade plancement
  //,trade cancellation and pushes the results
  //to the trade management class
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

  //adds connector to logger
  addConnector = (connector) => {
    this.connector = connector;
  };

  //adds feedback connector to the trade mangement
  addFeedbackConnector = (connector) => {
    this.feedbackConnector = connector;
  };

  //pushes data to all connectors
  //normally must push data to trade managment
  //since we are using sockets, their event listeners
  //are directly pushing the feeback to trademanagement
  //Now this pushes data only to the feedback connector
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

  //core function, placesTrades and cancels trade
  //does not use the respone sent after placing or
  //cancelling of trades all the responses are tracked
  //using user data stream.
  action(data) {
    if (data.label === "placeTrade") {
      const paramData = data.payload.map((datum) => {
        const { side, type, quantity, price } = datum;
        const symbol = this.symbol;
        //console.log(side, type, quantity, price);
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
      placeOrder(
        paramData[0],
        this.OrderAPI,
        this.binanceSecret,
        this.binanceAPI
      );
    } else if (data.label === "cancelOrders") {
      const symbol = this.symbol;
      if (data.payload.which === "STOP_MARKET") {
        //cancelOrder("BTCUSDT", 252213899, OrderAPI, binanceSecret, binanceAPI);
        cancelOrder(
          symbol,
          data.payload.id,
          this.OrderAPI,
          this.binanceSecret,
          this.binanceAPI
        ).catch((err) => console.log(err.message));
      } else if (data.payload.which === "TAKE_PROFIT_MARKET") {
        cancelOrder(
          symbol,
          data.payload.id,
          this.OrderAPI,
          this.binanceSecret,
          this.binanceAPI
        ).catch((err) => console.log(err.message));
      }
    }
  }
}
module.exports = {
  TradePlacementClass,
};
