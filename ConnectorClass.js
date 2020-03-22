const eventEmitter = require("events");
class Connector {
  constructor() {
    this.connection = new eventEmitter();
    this.target = null;
    this.connectTarget = this.connectTarget.bind(this);
    this.sendData = this.sendData.bind(this);
  }
  connectTarget(target) {
    this.target = target;
    this.connection.on("newData", this.sendData);
  }
  sendData(index, data) {
    this.target.getData.emit("newData", index, data);
    console.log("sending to target", index);
    //this.target.emit("newData", data);
  }
}
module.exports = {
  Connector
};
