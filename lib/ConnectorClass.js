const eventEmitter = require("events");
class Connector {
  constructor() {
    this.connection = new eventEmitter();
    //this.target = null;
    this.target = [];
    this.feedbackTarget = null;
    this.connectTarget = this.connectTarget.bind(this);
    this.connectFeedbackTarget = this.connectFeedbackTarget.bind(this);
    this.sendData = this.sendData.bind(this);
    this.sendFeedbackData = this.sendFeedbackData.bind(this);
    this.connection.on("newData", this.sendData);
  }
  connectTarget(target) {
    //this.target = target;
    this.target.push(target);
    //this.connection.on("newData", this.sendData);
  }
  connectFeedbackTarget(target) {
    this.feedbackTarget = target;
    this.connection.on("feedback", this.sendFeedbackData);
  }
  sendData(data) {
    try {
      //this.target.getData.emit("newData", data);
      this.target.forEach((e) => {
        e.getData.emit("newData", data);
      });
    } catch (err) {
      console.log(err.message);
    }
  }
  sendFeedbackData(data) {
    try {
      this.feedbackTarget.getData.emit("feedback", data);
    } catch (err) {
      console.log(err.message);
    }
  }
}
module.exports = {
  Connector,
};
