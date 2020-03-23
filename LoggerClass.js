const fs = require("fs");
const eventEmitter = require("events");
class Logger {
  constructor(filepath) {
    this.filepath = filepath;
    this.getData = new eventEmitter();
    //this.connector = null;
    //this.addConnector = this.addConnector.bind(this);
    this.getData.on("newData", this.logData);
  }
  //addConnector(connector) {
  //  this.connector = connector;
  //  this.getData.on("newData", this.action);
  //}
  logData(data) {
    console.log("logging done", data);
  }
}
module.exports = {
  Logger
};
