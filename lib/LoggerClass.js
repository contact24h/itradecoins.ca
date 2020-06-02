const fs = require("fs");
const eventEmitter = require("events");
class Logger {
  constructor(filepath) {
    this.filepath = filepath;
    this.getData = new eventEmitter();
    this.readData = this.readData.bind(this);
    this.writeData = this.writeData.bind(this);
    this.getData.on("newData", this.writeData);
  }
  //addConnector(connector) {
  //  this.connector = connector;
  //  this.getData.on("newData", this.action);
  //}
  readData(data) {
    const d = fs.readFileSync(this.filepath).toString("utf8");
    console.log(d);
  }

  async writeData(data) {
    try {
      console.log(data, "data sent to logger");
      await fs.promises.writeFile(this.filepath, "\n" + data, {
        encoding: "utf8",
        flag: "a"
      });
      console.log(data, "data written to logger");
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
//const lg = new Logger("./logs.txt");
//lg.readData();

//setInterval(() => {
//lg.writeData(new Date().toUTCString())
//  .then(res => {
//    console.log(res);
//    lg.readData();
//  })
//  .catch(err => {
//    console.log(err.message);
//  });
//}, 30000);

module.exports = {
  Logger
};
