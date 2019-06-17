var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var Security = require("../security.js");

function AuthenticationVerifier(authenticationService, protectionLevel, contextId, body){
  (authenticationService != undefined) ? this.authenticationService = authenticationService :
    this.authenticationService = Security.AUTHENTICATION_SERVICE_NONE;

  (protectionLevel != undefined) ? this.protectionLevel = protectionLevel :
    this.protectionLevel = Security.PROTECTION_LEVEL_NONE;

  (contextId != undefined) ? this.contextId = contextId : this.contextId = 0;

  (body != undefined) ? this.body = body : this.body = null;
}

AuthenticationVerifier.prototype.decode = function (ndr, src) {
  src.align(4);
  this.authenticationService = src.dec_ndr_small();
  this.protectionLevel = src.dec_ndr_small();
  src.dec_ndr_small();
  this.contextId = src.dec_ndr_long();

  var temp = src.getBuffer().slice(src.getIndex(), body.length);
  var temp_index= 0;
  while(temp.length > 0)
    body.splice(temp_index++, 0, temp.shift());
  src.index += body.length;
};

AuthenticationVerifier.prototype.encode = function (ndr, dst) {
  var padding = dst.align(4, 0);
  dst.enc_ndr_small(this.authenticationService);
  dst.enc_ndr_small(this.protectionLevel);
  dst.enc_ndr_small(this.padding);
  dst.enc_ndr_small(0);
  dst.enc_ndr_long(this.contextId);

  var temp = body.slice(0, body.length);
  var temp_index= src.getIndex();
  while(temp.length > 0)
    src.getBuffer().splice(temp_index++, 0, temp.shift());
  dst.advance(body.length);
};

AuthenticationVerifier.prototype.equals = function (obj) {
  if (!(obj instanceof AuthenticationVerifier)) return false;
  var other = obj;
  return (this.authenticationService == other.authenticationService &&
    this.protectionLevel == other.protectionLevel &&
    this.contextId == other.contextId &&
    ((body.join()) == (other.body.join())));
};

AuthenticationVerifier.prototype.hashCode = function () {
  return this.authenticationService ^ this.protectionLevel ^ this.contextId;
};

module.exports = AuthenticationVerifier;