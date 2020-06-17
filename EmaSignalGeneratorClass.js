const { SignalGenerator } = require("./lib/SignalGeneratorClass.js");
const tulind = require("tulind");

class EmaSignalGeneratorClass extends SignalGenerator {
  constructor() {
    super();
    this.getData.on("newData", this.generateSignal);
    this.updatedData = {};
    this.vwma = 0;
  }

  generateSignal = ({ label, payload }) => {
    //for undefined error in label
    if (label !== undefined) {
      this.updatedData[label] = payload;
    }
    if (label === "klines1m") {
      let temp = this.updatedData.klines1m.slice(450);
      let close = temp.map(e => Number(e[4]));
      let volume = temp.map(e => Number(e[5]));
      tulind.indicators.vwma.indicator(
        [close, volume],
        [15],
        (err, results) => {
          if (err) {
            console.log(err.message);
            return;
          }
          this.vwma = Number(results[0][results[0].length - 1].toFixed(2));
          return;
        }
      );
    } else if (label === "price") {
      if (this.vwma && payload.p) {
        if (Number(payload.p) > this.vwma + 5) {
          this.signal = "BUY";
        } else if (Number(payload.p) < this.vwma - 5) {
          this.signal = "SELL";
        }
      }
    }
    //console.log(
    //  "\n-----------------------------------------------------------"
    //);
    //console.log(
    //  "signal generator",
    //  this.signal,
    //  this.vwma,
    //  this.updatedData.price.p
    //);

    try {
      if (this.signal && this.vwma && this.updatedData.price.p) {
        //console.log("hehe", Object.keys(this.connector));
        this.connector.connection.emit("newData", {
          label: "signal",
          payload: {
            signal: this.signal,
            vwma: this.vwma,
            price: this.updatedData.price
              ? Number(this.updatedData.price.p)
              : null
          }
        });
      }
    } catch (err) {
      //console.log(err.message);
    }
  };
}

module.exports = EmaSignalGeneratorClass;
