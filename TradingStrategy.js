const { Connector } = require("./ConnectorClass.js");
const { DataPipeWebSocket } = require("./DataPipeClass.js");
const { SignalGenerator } = require("./SignalGeneratorClass.js");
const subscription1 = { op: "subscribe", args: ["trade"] };

const wp = new DataPipeWebSocket(
  0,
  "wss://stream.bybit.com/realtime",
  subscription1
);
const wp1 = new DataPipeWebSocket(
  1,
  "wss://stream.bybit.com/realtime",
  subscription1
);
const dataToSignalConnector = new Connector();
//const dataToSignalConnector1 = new Connector();
const sg = new SignalGenerator();
dataToSignalConnector.connectTarget(sg);
//dataToSignalConnector1.connectTarget(sg);
wp.addConnector(dataToSignalConnector);
wp1.addConnector(dataToSignalConnector);
