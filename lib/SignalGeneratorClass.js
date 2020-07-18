const eventEmitter = require("events");
class SignalGenerator {
  constructor() {
    this.signal = "BUY";
    this.updatedData = [];
    this.getData = new eventEmitter();
    this.addData = this.addData.bind(this);
    this.connector = null;
    this.updateData = this.updateData.bind(this);
    //this.generateSignal = this.generateSignal.bind(this);
    this.addConnector = this.addConnector.bind(this);
    //this.getData.on("newData", this.generateSignal);
  }
  addConnector(connector) {
    this.connector = connector;
    //this.getData.on("newData", this.generateSignal);
  }
  addData(index, data) {
    this.updatedData[index] = data;
  }
  updateData(index, data) {
    this.addData(index, data);
  }
  generateSignal({ label, payload }) {
    //your custom code for the strategy goes here
  }
}
module.exports = {
  SignalGenerator,
};
