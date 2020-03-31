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
  generateSignal({ index, data, label }) {
    //this.signal = "Buy";
    //this.updatedData[label] = data;
    ////console.log("signal", this.signal);
    //if (label === "klines1m") {
    //  console.log(
    //    index,
    //    label,
    //    new Date(data[data.length - 1][0]).toTimeString(),
    //    data[data.length - 1][4]
    //  );
    //} else {
    //  console.log(index, label, new Date(data.E).toTimeString(), data.p);
    //}
    //this.connector.connection.emit("newData", {
    //  signal: this.signal,
    //  data: {}
    //});
  }
}
module.exports = {
  SignalGenerator
};
