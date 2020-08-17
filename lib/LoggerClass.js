const fs = require("fs");
const eventEmitter = require("events");
class Logger {
  constructor(filepath) {
    this.filepath = filepath;
    this.getData = new eventEmitter();
    this.readData = this.readData.bind(this);
    this.writeData = this.writeData.bind(this);
    this.getData.on("newData", this.writeData);
    try {
      fs.promises.writeFile(this.filepath, "", {
        encoding: "utf8",
        flag: "a",
      });
    } catch (err) {
      throw new Error(error.message);
    }
  }

  //addConnector(connector) {
  //  this.connector = connector;
  //  this.getData.on("newData", this.action);
  //}

  readData(data) {
    const d = fs.readFileSync(this.filepath).toString("utf8");
    //console.log(d);
  }

  async writeData(data) {
    try {
      if (data.ot === "STOP_MARKET" || data.ot === "TAKE_PROFIT_MARKET") {
        let str = "";
        str += new Date(data.T).toUTCString() + ",";
        str += data.ot + ",";
        str += data.i + ",";
        str += data.s + ",";
        str += data.S + ",";
        str += data.X + ",";
        str += data.sp + ",";
        str += data.q + ";";
        await fs.promises.writeFile(this.filepath, "\n" + str, {
          encoding: "utf8",
          flag: "a",
        });
      } else if (data.X === "FILLED" || data.X === "CANCELLED") {
        let str = "";
        str += new Date(data.T).toUTCString() + ",";
        str += data.ot + ",";
        str += data.i + ",";
        str += data.s + ",";
        str += data.S + ",";
        str += data.X + ",";
        str += data.ap + ",";
        str += data.q + ";";
        await fs.promises.writeFile(this.filepath, "\n" + str, {
          encoding: "utf8",
          flag: "a",
        });
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = {
  Logger,
};
