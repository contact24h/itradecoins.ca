const eventEmitter = require("events");
const fetch = require("node-fetch");
class BackendDataEmitterClass {
  constructor(url) {
    //console.log("url was called", url);
    this.url = url;
    this.getData = new eventEmitter();
    this.sendDataToApi = this.sendDataToApi.bind(this);
    this.getData.on("newData", this.sendDataToApi);
  }
  sendDataToApi(data) {
    //console.log("data received", JSON.stringify(data));
    //console.log(this.url);
    try {
      fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        //.then((res) => console.log("posted successfully"))
        .catch((err) => console.log(err.message));
    } catch (err) {
      console.log(err.message);
    }
  }
}

module.exports = {
  BackendDataEmitterClass,
};
