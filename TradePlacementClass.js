const eventEmitter = require("events");
class TradePlacement {
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
    this.getData.on("newData", this.action);
  }
  addConnector(connector) {
    this.connector = connector;
    this.getData.on("newData", this.action);
  }
  placeTrade() {
    this.connector.connection.emit("newData", {
      action: "placeTrade",
      data: {}
    });
  }
  updateTrade() {
    this.connector.connection.emit("newData", {
      action: "updateTrade",
      data: {}
    });
  }
  deleteTrade() {
    this.connector.connection.emit("newData", {
      action: "deleteTrade",
      data: {}
    });
  }
  noAction() {
    this.connector.connection.emit("newData", {
      action: "noAction",
      data: {}
    });
  }
  action(data) {
    if (data.action === "placeTrade") {
      this.placeTrade();
    } else if (data.action === "updateTrade") {
      this.updateTrade();
    } else if (data.action === "delteTrade") {
      this.deleteTrade();
    } else {
      this.noAction();
    }
    console.log("action", data);
  }
}
module.exports = {
  TradePlacement
};
