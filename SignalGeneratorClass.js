const eventEmitter = require("events");
class SignalGenerator {
  constructor() {
    this.signal = "BUY";
    this.dataPipes = [];
    this.updatedData = [];
    this.getData = new eventEmitter();
    this.getData.on("newData", this.generateSignal);
    this.addData = this.addData.bind(this);
    //this.addDataPipe = this.addDataPipe.bind(this);
    this.updateData = this.updateData.bind(this);
    this.generateSignal = this.generateSignal.bind(this);
  }
  addData(index, data) {
    this.updatedData[index] = data;
  }
  updateData(index, data) {
    this.addData(index, data);
  }
  generateSignal(index, data) {
    //this.updatedData[index] = data;
    console.log("generating new Signal", index);
  }
}
module.exports = {
  SignalGenerator
};
