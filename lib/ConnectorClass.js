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
  sendData(data) {
    try {
      this.target.getData.emit("newData", data);
    } catch (err) {
      console.log(err.message);
    }
  }
}
module.exports = {
  Connector
};
