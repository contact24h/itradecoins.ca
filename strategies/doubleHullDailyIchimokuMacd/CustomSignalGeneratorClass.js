const { SignalGenerator } = require("../../lib/SignalGeneratorClass.js");
const tulind = require("tulind");

class CustomSignalGeneratorClass extends SignalGenerator {
  constructor(intervals) {
    super(intervals);
    this.getData.on("newData", this.generateSignal);
    this.updatedData = {};
    this.keh = 16;
    this.conversionPeriods = 4;
    this.basePeriods = 27;
    this.laggingSpan2Periods = 52;
    this.displacement = 20;
    this.slowMacd = 12;
    this.fastMacd = 26;
    this.macdLength = 10;
    this.lastDataTime = "";
    this.confidence = 0.01;
    this.hma = {};
    this.ichimokuResults = {};
    this.macd = {};

    //only to test.
    //this.temp = "SELL";
    //setInterval(() => {
    //  this.temp = this.temp === "SELL" ? "BUY" : "SELL";
    //  this.connector.connection.emit("newData", {
    //    label: "signal",
    //    payload: {
    //      signal: this.temp,
    //      Time: this.lastDataTime,
    //      "Hull Indicator": this.hma,
    //      Confidence: this.confidence,
    //      IchimokuResults: this.ichimokuResults,
    //      Macd: this.macd,
    //      "Last Price": this.close,
    //      "Last Quantity": this.lastQuantity,
    //    },
    //  });
    //}, 60000);
  }

  ichimokuCalculation = (data) => {
    const ichimokuResults = {};
    let temp = data.map((e) => [e[0], e[4], null, null, null, null]);
    let close = data.map((e) => e[4]);

    let i = temp.length - 1;
    if (i >= this.conversionPeriods) {
      const rangedData = close.slice(i - this.conversionPeriods, i);
      const minValue = Math.min(...rangedData);
      const maxValue = Math.max(...rangedData);
      ichimokuResults.conversionLine = ((minValue + maxValue) / 2).toFixed(2);
    }
    if (i >= this.basePeriods) {
      const rangedData = close.slice(i - this.basePeriods, i);
      const minValue = Math.min(...rangedData);
      const maxValue = Math.max(...rangedData);
      ichimokuResults.baseLine = ((minValue + maxValue) / 2).toFixed(2);
    }
    if (i >= Math.max(this.basePeriods, this.conversionPeriods)) {
      ichimokuResults.leadLine1 = (
        (Number(ichimokuResults.conversionLine) +
          Number(ichimokuResults.baseLine)) /
        2
      ).toFixed(2);
    }
    if (i >= this.laggingSpan2Periods) {
      const rangedData = close.slice(i - this.laggingSpan2Periods, i);
      const minValue = Math.min(...rangedData);
      const maxValue = Math.max(...rangedData);
      ichimokuResults.leadLine2 = ((minValue + maxValue) / 2).toFixed(2);
    }

    ichimokuResults.displacement = this.displacement;
    ichimokuResults.LM = temp[i][1];
    return ichimokuResults;
  };

  generateSignal = ({ label, payload }) => {
    //for undefined error in label
    //console.log("custom signal", this.intervals);
    if (label !== undefined) {
      this.updatedData[label] = payload;
    }
    if (label === "klines" + this.intervals[0]) {
      //console.log("updated data",Object.keys(this.updatedData))
      //console.log("parameter",this.updatedData["klines"+this.intervals[0]].length)
      let temp = this.updatedData["klines" + this.intervals[0]].slice(450);
      //console.log(temp[temp.length - 1]);
      //console.log("temp",temp.length)
      let close = temp.map((e) => Number(e[4]));
      let volume = temp.map((e) => Number(e[5]));

      //calulation of hull moving average
      tulind.indicators.hma.indicator([close], [this.keh], (err, results) => {
        if (err) {
          console.log("error here", err.message);
          return;
        }
        this.hma.n1 = Number(results[0][results[0].length - 1].toFixed(2));
        this.hma.n2 = Number(results[0][results[0].length - 2].toFixed(2));
        return;
      });

      //calculation of confidence
      const lastClose = close[close.length - 1];
      const lastBeforeClose = close[close.length - 2];
      this.confidence = (lastClose - lastBeforeClose) / lastClose;
      this.confidence = this.confidence.toFixed(3);

      //calculation of ichimoku
      this.ichimokuResults = this.ichimokuCalculation(
        this.updatedData["klines" + this.intervals[0]].slice(430)
      );

      //calculation of macd
      tulind.indicators.macd.indicator(
        [close],
        [this.slowMacd, this.fastMacd, this.macdLength],
        (err, results) => {
          if (err) {
            console.log("error here", err.message);
            return;
          }
          //console.log(results[0].slice(-1));
          this.macd.macd = results[0].slice(-1)[0];
          this.macd.aMacd = results[1].slice(-1)[0];
          return;
        }
      );
      //set last updated data time
      this.lastDataTime = new Date(temp.slice(-1)[0][0]).toUTCString();
      this.close = Number(temp.slice(-1)[0][4]);
      this.open = Number(temp.slice(-1)[0][1]);
      this.lastQuantity = Number(temp.slice(-1)[0][5]);
      //console.log(temp.slice(-1)[0][0]);

      if (
        this.hma.n1 > this.hma.n2 &&
        this.confidence > 0 &&
        this.close > this.hma.n2 &&
        this.ichimokuResults.leadLine1 > this.ichimokuResults.leadLine2 &&
        this.open < this.close &&
        this.macd.macd > this.macd.aMacd
      ) {
        this.signal = "BUY";
        //this.printSignal(true);
        //this.printDetails();
        this.connector.connection.emit("newData", {
          label: "signal",
          payload: {
            signal: this.signal,
            Time: this.lastDataTime,
            "Hull Indicator": this.hma,
            Confidence: this.confidence,
            IchimokuResults: this.ichimokuResults,
            Macd: this.macd,
            "Last Price": this.close,
            "Last Quantity": this.lastQuantity,
          },
        });
      } else if (
        this.hma.n1 < this.hma.n2 &&
        this.confidence < 0 &&
        this.close < this.hma.n2 &&
        this.ichimokuResults.leadLine1 < this.ichimokuResults.leadLine2 &&
        this.open > this.close &&
        this.macd.macd < this.macd.aMacd
      ) {
        this.signal = "SELL";
        //this.printSignal(true, temp[temp.length - 1]);
        //this.printDetails();
        this.connector.connection.emit("newData", {
          label: "signal",
          payload: {
            signal: this.signal,
            Time: this.lastDataTime,
            "Hull Indicator": this.hma,
            Confidence: this.confidence,
            IchimokuResults: this.ichimokuResults,
            Macd: this.macd,
            "Last Price": this.close,
            "Last Quantity": this.lastQuantity,
          },
        });
      } else if (
        this.hma.n1 < this.hma.n2 &&
        this.close < this.hma.n2 &&
        this.confidence < 0
      ) {
        //handled by the exchange
        //this.signal = "EXIT_BUY";
      } else if (
        this.hma.n1 > this.hma.n2 &&
        this.close > this.hma.n2 &&
        this.confidence > 0
      ) {
        //handled by the exchange
        //this.signal = "EXIT_SELL";
        //this.printDetails();
      } else {
        //do nothing.
        //this.printSignal(false);
        //this.printDetails();
        this.connector.connection.emit("newData", {
          label: "signal",
          payload: {
            signal: "None",
            Time: this.lastDataTime,
            "Hull Indicator": this.hma,
            Confidence: this.confidence,
            IchimokuResults: this.ichimokuResults,
            Macd: this.macd,
            "Last Price": this.close,
            "Last Quantity": this.lastQuantity,
          },
        });
      }
    }
  };
  printDetails = () => {
    console.log("Time: ", this.lastDataTime);
    console.log(`Last Price:${this.close} Last Quantity:${this.lastQuantity}`);
    console.log(`Hull Indicator: `, this.hma);
    console.log(`Confidence: `, this.confidence);
    console.log(`IchimokuResults: `, this.ichimokuResults);
    console.log("Macd: ", this.macd);
  };
  printSignal = (hasSignal) => {
    console.log(
      "\n-----------------------------------------------------------"
    );
    if (hasSignal) {
      console.log("SIGNAL", this.signal);
    } else {
      console.log("SIGNAL", "NONE");
    }
    //console.log(
    //  "\n-----------------------------------------------------------"
    //);
  };
}

module.exports = CustomSignalGeneratorClass;
