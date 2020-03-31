const webSocket = require("ws");
const fetch = require("node-fetch");
const url = require("url");
//console.log(URL);

class DataPipeWebSocket {
  constructor(index, url, subscription) {
    this.index = index;
    this.url = url;
    //this.webSocket = null;
    this.subscription = subscription;
    this.addConnector = this.addConnector.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.dataSanitizer = this.dataSanitizer.bind(this);
    this.webSocket = new webSocket(this.url);
    this.labels = { aggTrade: "price" };
  }
  addConnector(connector) {
    this.webSocket.onmessage = data => {
      let da;
      try {
        da = this.dataSanitizer(data.data);
        //console.log(da);
      } catch (err) {
        console.log(err.message);
      }
      connector.connection.emit("newData", {
        index: this.index,
        label: this.labels[da.e],
        data: da
      });
    };
    this.webSocket.onerror = err => {
      console.log(err.message);
    };
    this.webSocket.onopen = () => {
      this.webSocket.send(JSON.stringify(this.subscription));
    };
  }
  subscribe(message) {
    this.webSocket.send(JSON.stringify(message));
  }
  dataSanitizer(data) {
    return JSON.parse(data);
  }
}
class DataPipeREST {
  constructor(index, Url) {
    this.index = index;
    this.URL = Url;
    this.connector = null;
    this.interval = null;
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
    this.getKlinesAndStreamtoConnector = (interval, symbol, label) => {
      this.getKlines(interval, symbol).then(data => {
        try {
          //console.log(data.length);
          this.connector.connection.emit("newData", {
            index: this.index,
            data,
            label
          });
        } catch (err) {
          console.log(err.message);
        }
      });
    };
  }
  getKlines(interval, symbol) {
    let options = {
      symbol,
      interval
      //startTime:"",
      //endTime:"",
      //limit: 500
    };
    const temp = new URL(this.URL);
    temp.pathname = "/api/v3/klines";
    //console.log(interval, symbol);
    Object.keys(options).forEach(e => temp.searchParams.append(e, options[e]));
    return fetch(temp)
      .then(res => {
        //console.log(res);
        return res;
      })
      .then(res => res.json())
      .catch(err => console.log(err.message));
  }
  getKlinesAndStreamtoConnector() {}
  repeatGetKlinesAndStreamtoConnectorForEachInterval(interval, symbol, label) {
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
      "1w": min * 10080
    };
    this.getKlinesAndStreamtoConnector(interval, symbol, label);
    setInterval(() => {
      this.getKlinesAndStreamtoConnector(interval, symbol, label);
    }, timeObject[interval]);
  }
}
//const dr = new DataPipeREST(0, "https://api.binance.com/api/v3/klines");

//dr.getKlines("1m");
module.exports = {
  DataPipeWebSocket,
  DataPipeREST
};
