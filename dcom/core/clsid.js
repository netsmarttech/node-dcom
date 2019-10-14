// @ts-check
var UUID = require('../rpc/core/uuid.js');

/**
 * ClassID object
 */
class Clsid {
  /**
   * Creates a ClassID object from a
   * given uuid.
   * @param {String} uuid
   */
  constructor(uuid) {
    if (!this.checkSyntax(uuid)) throw new Error("Invalid Clsid Syntax");
    this.nestedUUID = new UUID(uuid);
    this.autoRegister = false;
  }

  setAutoRegistration(autoRegister) {
    this.autoRegister = autoRegister;
  }

  isAutoRegistrationSet() {
    return this.autoRegister;
  }

  valueOf(uuid) {
    if (uuid == null) {
      return null;
    }
    return new Clsid(uuid);
  }

  getClsid() {
    return this.nestedUUID.toString();
  }

  /**
   * Verifies if the current CLSID (string) has the appropriate syntax
   * @param {Clsid} clsid
   * @return {Boolean}
   */
  checkSyntax(clsid) {
    const exp = new RegExp('[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}');
    return clsid.match(exp);
  }
}

module.exports = Clsid;
