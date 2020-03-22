const webSocket = require("ws");
class DataPipe {}
class DataPipeWebSocket {
  constructor(index, url, subscription) {
    this.index = index;
    this.url = url;
    this.subscription = subscription;
    this.addConnector = this.addConnector.bind(this);
    this.webSocket = null;
  }
  addConnector(connector) {
    this.webSocket = new webSocket(this.url);
    this.webSocket.onmessage = data => {
      connector.connection.emit("newData", this.index, JSON.parse(data.data));
    };
    this.webSocket.onerror = data => {
      console.log(error);
    };
    //multiple subscriptions goes here
    //const temp = { op: "subscribe", args: ["trade"] };
    this.webSocket.onopen = () => {
      this.webSocket.send(JSON.stringify(this.subscription));
    };
  }
}
class DataPipeREST {}
module.exports = {
  DataPipeWebSocket
};
