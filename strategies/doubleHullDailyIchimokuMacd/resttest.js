const webSocket = require("ws");
const fetch = require("node-fetch");
const url = require("url");

async function repeatGetKlinesAndStreamtoConnectorForEachInterval(
  interval,
  symbol
) {
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

  let z = await getKlinesAndStreamtoConnector(interval, symbol, true);
  let a = z[0][0];
  let b = z[z.length - 1][0];
  let c = Date.now();
  let delta = timeObject[interval] - c + b + 5000;
  console.log("start time : ", c, b);
  //console.log(delta, timeObject[interval]);
  setTimeout(() => {
    getKlinesAndStreamtoConnector(interval, symbol, false);
    setInterval(() => {
      getKlinesAndStreamtoConnector(interval, symbol, false);
    }, timeObject[interval]);
  }, delta);
}

const getKlinesAndStreamtoConnector = (interval, symbol, ret) => {
  if (ret) {
    return getKlines(interval, symbol).then((data) => {
      try {
        console.log(data[data.length - 1][0]);
        return data;
      } catch (err) {
        console.log(err.message);
      }
    });
  } else {
    getKlines(interval, symbol).then((data) => {
      try {
        console.log(data[data.length - 1][0]);
        return data;
      } catch (err) {
        console.log(err.message);
      }
    });
  }
};

const getKlines = (interval, symbol) => {
  let options = {
    symbol,
    interval,
  };
  const temp = new URL("https://api.binance.com");
  temp.pathname = "/api/v3/klines";
  //console.log(interval, symbol);
  Object.keys(options).forEach((e) => temp.searchParams.append(e, options[e]));
  //console.log(temp)
  return (
    fetch(temp, { method: "GET" })
      .then((res) => {
        return res.json();
      })
      .then((r) => {
        //console.log(res.slice(-1)[0]);
        return r;
      })
      //.then((k)=>console.log(k))
      .catch((err) => console.log(err.message))
  );
};
repeatGetKlinesAndStreamtoConnectorForEachInterval("1m", "BTCUSDT");
