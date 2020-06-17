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
    this.getData.on("newData", this.action);
    this.stopLoss = "";
    this.trade = "";
    this.takeProfit = "";
    this.userWebSocket;
    this.orderEmitter = new eventEmitter();
    this.orderEmitter.on("placeOrders", data => {
      //console.log(data);
      if (data.length > 0) {
        placeOrder(data[0]).then(res => {
          this[res.type] = res["orderId"];
          this.pushDataToConnector(data);
          this.orderEmitter.emit("placeOrders", data.slice(1));
        });
      }
    });
    this.orderEmitter.on("cancelOrders", data => {
      if (data.length > 0) {
        cancelOrders(symbol, data[0]).then(res => {
          this[res.type] = res["orderId"];
          this.pushDataToConnector(data);
          this.orderEmitter.emit("cancelOrders", data.slice(1));
        });
      }
    });

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
    //console.log(data);
    if (data.label === "placeTrade") {
      const paramData = data.payload.map(datum => {
        const { side, type, quantity, price } = datum;
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
      //console.log(paramData);
      this.orderEmitter.emit("placeOrders", paramData);
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
        placeOrder(params)
          .then(data => {
            this[data.type] = null;
            this.pushDataToConnector(data);
          })
          .then(() => {
            cancelOrder(symbol, this.STOP_MARKET)
              .then(() => {
                this["STOP_MARKET"] = null;
              })
              .catch(err => console.log(err.message));
          })
          .then(() => {
            cancelOrder(symbol, this.TAKE_PROFIT_MARKET)
              .then(() => {
                this["TAKE_PROFIT_MARKET"] = null;
              })
              .catch(err => console.log(err.message));
          })
          .catch(err => console.log(err.message));
      } else if (data.payload.which === "STOP_MARKET") {
        cancelOrder(symbol, this.STOP_MARKET)
          .then(() => {
            this["STOP_MARKET"] = null;
          })
          .catch(err => console.log(err.message));
      } else if (data.payload.which === "TAKE_PROFIT_MARKET") {
        cancelOrder(symbol, this.TAKE_PROFIT_MARKET)
          .then(() => {
            this["TAKE_PROFIT_MARKET"] = null;
          })
          .catch(err => console.log(err.message));
      }
    }
  };
}
module.exports = {
  TradePlacementClass
};
