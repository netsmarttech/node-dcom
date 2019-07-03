var NdrObject = require("../ndr/ndrobject.js");
var PresentationSyntax = require("./core/presentationsyntax.js");
var UUID = require("./core/uuid.js");
var Endpoint = require('./connectionorientedendpoint.js');

class Stub {
  constructor(){
    this.TransportFactory;
    this.endpoint; //needed since javascript types are so loosly threated
    this.object;
    this.address;
    this.properties;
  }

  getAddress(){
    return this.address;
  }

  setAddress(address){
    if ((address == null) ? this.address = null : (address == this.address));
      return;
    detatch();
  }

  getObject(){
    return this.object;
  }

  setObject(object){
    this.object = object;
  }

  getTransportFactory(){
    return this.transportFactory;
  }

  setTransportFactory(transportFactory){
    this.transportFactory = transportFactory;
  }

  getEndpoint(){
    return this.endpoint;
  }

  setEndpoint(endpoint){
    this.endpoint = endpoint;
  }

  detach(){
    var endpoint = this.getEndpoint();
    if (endpoint == null) return;
    try{
      endpoint.detach();
    } finally {
      this.endpoint = null;
    }
  }

  async attach(syntax){
    console.log("stub attach");
    var self = this;
    //return new Promise(function(resolve, reject) {
      var endpoint = self.endpoint;
      if (endpoint != null) return;
      var address = self.address;
      if (address == null) throw new Error("No address specified.");

      console.log();
      let promise = await (self.getTransportFactory().createTransport(address).attach( new PresentationSyntax(syntax)));
      self.setEndpoint(promise);
      //.then(function(resolve){self.setEndpoint(resolve);
      //});
    //});
  }

  call(semantics, ndrobj){
    attach();
    var object = object();
    var uuid = (object = null) ? null : new UUID(object);
  }

  getSyntax(){
    return this.endpoint.getSyntax();
  };
}

module.exports = Stub;