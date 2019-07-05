var NtlmMessage = require('./ntlmmessage.js');
var SmbConstants = require('../../../ndr/smbconstants.js');
var Buffer = require('buffer');
var HexDump = require('../../../ndr/hexdump.js');

class Type1Message extends NtlmMessage
{
  constructor(tc, flags, suppliedDomain, suppliedWorkstation){
    super();
    console.log(suppliedDomain, suppliedWorkstation);
    this.suppliedDomain;
    this.suppliedWorkstation;

    if (!(arguments[0] instanceof Array)){
      (flags) ? this.setFlags(this.getDefaultFlags(tc) | flags) :
        this.getDefaultFlags();
      (suppliedDomain) ? this.setSuppliedDomain(suppliedDomain) :console.log("No domain provided");

      (suppliedWorkstation) ? this.setSuppliedWorkstation(suppliedWorkstation) :
        console.log("No workstation provided");
    } else {
      this.parse(dc);
    }
  }

  getDefaultFlags(unicode)
  {
    return SmbConstants.NTLMSSP_NEGOTIATE_NTLM
      | SmbConstants.NTLMSSP_NEGOTIATE_VERSION
      | unicode ? SmbConstants.NTLMSSP_NEGOTIATE_UNICODE :
        SmbConstants.NTLMSSP_NEGOTIATE_OEM;
  }

  getSuppliedDomain()
  {
    return this.suppliedDomain;
  }

  setSuppliedDomain(suppliedDomain)
  {
    this.suppliedDomain = suppliedDomain;
  }

  getSuppliedWorkstation()
  {
    return this.suppliedWorkstation;
  }

  setSuppliedWorkstation(suppliedWorkstation)
  {
    this.suppliedWorkstation = suppliedWorkstation;
  }

  toByteArray()
  {
    try {
      var flags = this.getFlags();
      var size = 8 * 4 + ((this.flags &
        SmbConstants.NTLMSSP_NEGOTIATE_VERSION) != 0 ? 8 : 0);

      var domain;
      var suppliedDomainString = this.getSuppliedDomain();
      if ((flags & SmbConstants.NTLMSSP_NEGOTIATE_VERSION) == 0 &&
        suppliedDomainString != null && suppliedDomainString.length != 0) {
        this.flags |= SmbConstants.NTLMSSP_NEGOTIATE_OEM_DOMAIN_SUPPLIED;
        domain = [...Buffer.from(suppliedDomainString.toUpperCase(), this.getOEMEncoding())];
        size += domain.length;
      }else {
        this.flags &= SmbConstants.NTLMSSP_NEGOTIATE_OEM_DOMAIN_SUPPLIED ^ 0xffffffff;
      }

      var workstation;
      var suppliedWorkstationString = this.getSuppliedDomain();
      if ((flags & SmbConstants.NTLMSSP_NEGOTIATE_VERSION) == 0 &&
        suppliedWorkstationString != null && suppliedWorkstationString.length != 0) {
        this.flags |= SmbConstants.NTLMSSP_NEGOTIATE_OEM_WORKSTATION_SUPPLIED;
        workstation = [...Buffer.from(suppliedWorkstationString.toUpperCase(), this.getOEMEncoding())];
        size += workstation.length;
      }else {
        this.flags &= SmbConstants.NTLMSSP_NEGOTIATE_OEM_WORKSTATION_SUPPLIED ^ 0xffffffff;
      }
      var type1 = [];
      var pos = 0;

      type1.concat(this.NTLMSSP_SIGNATURE.slice(0, this.NTLMSSP_SIGNATURE.length));
      pos += this.NTLMSSP_SIGNATURE.length;

      this.writeULong(type1, pos, this.TYPE1);
      pos += 4;

      this.writeUlong(type1, pos, flags);
      pos += 4;

      var domOffOff = this.writeSecurityBuffer(type1, pos, domain);
      pos += 8;

      var domOffOff = this.writeSecurityBuffer(type1, pos, workstation);
      pos += 8;

      if ( ( flags & NTLMSSP_NEGOTIATE_VERSION ) != 0 ) {
        var aux = this.NTLMSSP_VERSION.slice(0, this.NTLMSSP_VERSION.length);
        var aux_i = pos;
        while (aux.length > 0)
          type1.splice(aux_i++, 0, aux.shift());
        pos += NTLMSSP_VERSION.length;
      }

      pos += this.writeSecurityBufferContent(type1, pos, domOffOff, domain);
      pos += this.writeSecurityBufferContent(type1, pos, wsOffOff, workstation);
      return type1;
    } catch (err) {
      throw new Erro(err);
    }
  }

  toString()
  {
    var suppliedDomainString = this.getSuppliedDomain();
    var suppliedWorkstationString = this.getSuppliedWorkstation();
    return "Type1Message[suppliedDomain=" + ( suppliedDomainString == null ? "null" : suppliedDomainString ) + ",suppliedWorkstation="
      + ( suppliedWorkstationString == null ? "null" : suppliedWorkstationString ) + ",flags=0x"
      + Hexdump.toHexString(this.getFlags(), 8) + "]";
  }

  parse (material )
  {
    var pos = 0;
    for (var i = 0; i < 8; i++ ) {
        if ( material[ i ] != this.NTLMSSP_SIGNATURE[ i ] ) {
            throw new Error("Not an NTLMSSP message.");
        }
    }
    pos += 8;

    if (this.readULong(material, pos) != this.TYPE1 ) {
        throw new Error("Not a Type 1 message.");
    }
    pos += 4;

    var flags = this.readULong(material, pos);
    this.setFlags(flags);
    pos += 4;

    if ( ( flags & SmbConstants.NTLMSSP_NEGOTIATE_OEM_DOMAIN_SUPPLIED ) != 0 ) {
        var domain = this.readSecurityBuffer(material, pos);
        this.setSuppliedDomain(new String(domain, this.getOEMEncoding()));
    }
    pos += 8;

    if ( ( flags & SmbConstants.NTLMSSP_NEGOTIATE_OEM_WORKSTATION_SUPPLIED ) != 0 ) {
        var workstation = this.readSecurityBuffer(material, pos);
        this.setSuppliedWorkstation(new String(workstation, this.getOEMEncoding()));
    }
    pos += 8;
  }
}

module.exports = Type1Message;
