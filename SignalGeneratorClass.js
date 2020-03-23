const eventEmitter = require("events");
class SignalGenerator {
  constructor() {
    this.signal = "BUY";
    this.updatedData = [];
    this.getData = new eventEmitter();
    this.addData = this.addData.bind(this);
    this.connector = null;
    this.updateData = this.updateData.bind(this);
    this.generateSignal = this.generateSignal.bind(this);
    this.addConnector = this.addConnector.bind(this);
  }
  addConnector(connector) {
    this.connector = connector;
    this.getData.on("newData", this.generateSignal);
  }
  addData(index, data) {
    this.updatedData[index] = data;
  }
  updateData(index, data) {
    this.addData(index, data);
  }
  generateSignal({ index, data }) {
    this.signal = "Buy";
    console.log("signal", this.signal);
    this.connector.connection.emit("newData", {
      signal: this.signal,
      data: {}
    });
  }
}
module.exports = {
  SignalGenerator
};
