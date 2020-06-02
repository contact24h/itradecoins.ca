const eventEmitter = require("events");
const { placeOrder } = require("../utils/index.js");
class TradePlacementClass {
  constructor() {
    this.url = "";
    this.authentication = {};
    this.getData = new eventEmitter();
    this.connector = null;
    this.addConnector = this.addConnector.bind(this);
    this.placeTrade = this.placeTrade.bind(this);
    this.updateTrade = this.updateTrade.bind(this);
    this.deleteTrade = this.deleteTrade.bind(this);
    this.noAction = this.noAction.bind(this);
    this.action = this.action.bind(this);
    //this.getData.on("newData", this.action);
    this.getData.on("newData", this.action);
  }
  addConnector = connector => {
    this.connector = connector;
  };
  placeTrade = () => {
    this.connector.connection.emit("newData", {
      action: "placeTrade",
      data: {}
    });
  };
  updateTrade = () => {
    this.connector.connection.emit("newData", {
      action: "updateTrade",
      data: {}
    });
  };
  deleteTrade = () => {
    this.connector.connection.emit("newData", {
      action: "deleteTrade",
      data: {}
    });
  };
  noAction = () => {
    this.connector.connection.emit("newData", {
      action: "noAction",
      data: {}
    });
  };
  addConnector = connector => {
    this.connector = connector;
    //this.getData.on("newData", this.takeActionBasedOnSignal);
    //this.getData.on("updateData", this.updateValuesBasedOnTradeExecution);
  };
  pushDataToConnector = data => {
    console.log("ps", data);
    this.connector.connection.emit("newData", {
      label: "traded",
      payload: data
    });
  };
  action = data => {
    if (data.label === "BUY") {
      console.log(
        `BUY Trade placed ${data.payload.price} quanity: ${data.payload.quantity}`
      );
      placeOrder("BUY", data.payload.price, data.payload.quantity).then(
        data => {
          console.log(data);
          this.pushDataToConnector(data);
        }
      );
    } else {
      console.log(
        `SELL Trade placed ${data.payload.price} quanity: ${data.payload.quanity}`
      );
      placeOrder("SELL", data.payload.price, data.payload.quantity).then(
        data => {
          console.log(data);
          this.pushDataToConnector(data);
        }
      );
    }

    //if (data.action === "placeTrade") {
    //  this.placeTrade();
    //} else if (data.action === "updateTrade") {
    //  this.updateTrade();
    //} else if (data.action === "delteTrade") {
    //  this.deleteTrade();
    //} else {
    //  this.noAction();
    //}
    //console.log("action", data);
  };
}
module.exports = {
  TradePlacementClass
};
