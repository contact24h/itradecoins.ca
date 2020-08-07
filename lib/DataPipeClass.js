const webSocket = require("ws");
const fetch = require("node-fetch");
const url = require("url");

class DataPipeWebSocket {
  constructor(url) {
    this.url = url;
    //this.subscription = subscription;
    this.addConnector = this.addConnector.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.dataSanitizer = this.dataSanitizer.bind(this);
    this.webSocket = new webSocket(this.url);
    this.labels = { aggTrade: "price" };
    this.open = false;
    this.subscriptions = [];
  }
  addConnector(connector) {
    this.webSocket.onmessage = (data) => {
      let da;
      try {
        da = this.dataSanitizer(data.data);
      } catch (err) {
        console.log(err.message);
      }
      //console.log(data.data);
      connector.connection.emit("newData", {
        label: this.labels[da.e],
        payload: da,
      });
    };
    this.webSocket.onerror = (err) => {
      console.log(err.message);
    };
    this.webSocket.onopen = () => {
      //this.webSocket.send(JSON.stringify(this.subscription));
      this.open = true;
      this.subscriptions.forEach((e) => {
        this.webSocket.send(JSON.stringify(e));
      });
      this.subscriptions = [];
    };
  }
  subscribe(message) {
    if (!this.open) {
      this.subscriptions.push(message);
    } else {
      this.webSocket.send(JSON.stringify(message));
    }
  }
  dataSanitizer(data) {
    return JSON.parse(data);
  }
}

class DataPipeREST {
  constructor(Url) {
    //this.index = index;
    this.URL = Url;
    this.connector = null;
    //this.interval = null;
    this.getKlines = this.getKlines.bind(this);
    this.getKlinesAndStreamtoConnector = this.getKlinesAndStreamtoConnector.bind(
      this
    );
    this.repeatGetKlinesAndStreamtoConnectorForEachInterval = this.repeatGetKlinesAndStreamtoConnectorForEachInterval.bind(
      this
    );
  }
  addConnector(connector) {
    this.connector = connector;
    this.getKlinesAndStreamtoConnector = (interval, symbol, ret) => {
      if (ret) {
        return this.getKlines(interval, symbol).then((data) => {
          try {
            this.connector.connection.emit("newData", {
              payload: data,
              label: "klines" + interval,
            });
            return data;
          } catch (err) {
            console.log(err.message);
          }
        });
      } else {
        this.getKlines(interval, symbol).then((data) => {
          try {
            this.connector.connection.emit("newData", {
              payload: data,
              label: "klines" + interval,
            });
          } catch (err) {
            console.log(err.message);
          }
        });
      }
    };
  }
  getKlines(interval, symbol) {
    let options = {
      symbol,
      interval,
      //startTime:"",
      //endTime:"",
      //limit: 500
    };
    const temp = new URL(this.URL);
    temp.pathname = "/api/v3/klines";
    //console.log(interval, symbol);
    Object.keys(options).forEach((e) =>
      temp.searchParams.append(e, options[e])
    );
    //console.log(temp)
    return (
      fetch(temp, { method: "GET" })
        .then((res) => res.json())
        //.then((k)=>console.log(k))
        .catch((err) => console.log(err.message))
    );
  }
  getKlinesAndStreamtoConnector() {}
  async repeatGetKlinesAndStreamtoConnectorForEachInterval(interval, symbol) {
    const min = 60000;
    const timeObject = {
      "1m": min,
      "3m": min * 3,
      "5m": min * 5,
      "15m": min * 15,
      "30m": min * 30,
      "1h": min * 60,
      "2h": min * 120,
      "4h": min * 240,
      "6h": min * 360,
      "8h": min * 480,
      "12h": min * 720,
      "1d": min * 1440,
      "3d": min * 4320,
      "1w": min * 10080,
    };

    let z = await this.getKlinesAndStreamtoConnector(interval, symbol, true);
    let a = z[0][0];
    let b = z[z.length - 1][0];
    let c = Date.now();
    //5000 ms is for safety so that binance sends the updated value
    let delta = timeObject[interval] - c + b + 5000;
    //console.log("start time : ", c, b);
    //console.log(delta, timeObject[interval]);
    setTimeout(() => {
      this.getKlinesAndStreamtoConnector(interval, symbol, false);
      setInterval(() => {
        this.getKlinesAndStreamtoConnector(interval, symbol, false);
      }, timeObject[interval]);
    }, delta);
  }
}
//const dr = new DataPipeREST(0, "https://api.binance.com/api/v3/klines");

module.exports = {
  DataPipeWebSocket,
  DataPipeREST,
};
