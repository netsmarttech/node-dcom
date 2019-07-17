//@ts-check
const Flags = require('./flags');
const Variant = require('./variant');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

const types = require('./types');
const ComValue = require('./comvalue');

/**
 * we don't have a "hashCode()" for objects, so let's generate
 * a random number and put a reference to it here
 */
const objectIDs = new WeakMap();
function randomInt() {
    return Math.trunc(Math.random() * 0xFFFFFFFF);
}
const primitiveIDs = new Map();
function getObjectHash(obj) {
    if (primitiveIDs.has(obj)) {
        //test for primitives first ...
        return primitiveIDs.get(obj);
    } else if (objectIDs.has(obj)) {
        // ... then for existing objects ...
        return objectIDs.get(obj);
    } else {
        // ... or not found, create one
        let id = randomInt();
        switch (typeof obj) {
            case 'number':
            case 'boolean':
            case 'string':
                primitiveIDs.set(obj, id);
                break;
            default:
                objectIDs.set(obj, id);
        }
        return id;
    }
}

class Pointer {

    /**
     * 
     * @param {ComValue} [value]
     * @param {boolean} [isReferenceTypePtr]
     */
    constructor(value, isReferenceTypePtr) {
        /**@type {ComValue} */
        this.referent = value;
        this.isReferenceTypePtr = isReferenceTypePtr;
        this.isDeffered = false;
        this.referentId = -1;
        this._isNull = false;
        this.flags = Flags.FLAG_NULL;
        this.nullSpecial = false

        if (value === null || value === undefined) {
            value = new ComValue(0, types.INTEGER);
            isReferenceTypePtr = true;
            this._isNull = true;
        }

        if (value.value !== null && value.value !== undefined){
            this.referentId = randomInt();
        }
    }


	/**
	 * Some COM servers send referentId (pointer) as null but the referent is not. To be used only when you know this is the case.
	 * Better leave it unsed.
	 */
    treatNullSpecially() {
        this.nullSpecial = true;
    }

	/** Sets the flags associated with the referent.
	 *
	 * @exclude
	 * @param {number} flags Flags only.
	 */
    setFlags(flags) {
        this.flags = flags;
    }

    setIsReferenceTypePtr() {
        this.isReferenceTypePtr = true;
    }


	/** Returns the referent encapsulated by this pointer.
	 *
	 * @returns {ComValue}
	 */
    getReferent() {
        return this._isNull ? null : this.referent;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @param {?} defferedPointers  
     * @param {number} flag 
     */
    encode(ndr, defferedPointers, flag) {

        flag = flag | this.flags;
        if (this._isNull) {
            MarshalUnMarshalHelper.serialize(ndr, new ComValue(0, types.INTEGER), defferedPointers, flag);
            return;
        }

        //it is deffered or part of an array, this logic will not get called twice since the
        //deffered list will come in withb FLAG_NULL
        if (!this._isNull && (this.isDeffered || (flag & Flags.FLAG_REPRESENTATION_ARRAY) == Flags.FLAG_REPRESENTATION_ARRAY)) {
            let referentIdToPut = this.referentId == -1 ? getObjectHash(this.referent) : this.referentId;
            MarshalUnMarshalHelper.serialize(ndr, new ComValue(referentIdToPut, types.INTEGER), defferedPointers, flag);
            this.isDeffered = false;
            this.isReferenceTypePtr = true;
            defferedPointers.push(this);
            return;
        }

        if (!this._isNull && !this.isReferenceTypePtr) {
            let referentIdToPut = this.referentId == -1 ? getObjectHash(this.referent) : this.referentId;
            MarshalUnMarshalHelper.serialize(ndr, new ComValue(referentIdToPut, types.INTEGER), defferedPointers, flag);
        }


        if (!this._isNull && this.referent.value instanceof Variant && this.referent.value.isArray()) {
            MarshalUnMarshalHelper.serialize(ndr, new ComValue(this.referent.value.getObject().length, types.INTEGER), defferedPointers, flag);
        }

        MarshalUnMarshalHelper.serialize(ndr, this.referent, defferedPointers, flag);
    }

    //class of type being decoded. If the type being expected is an array , the varType
    //should be the actual array type and not JIArray.
    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @param {Pointer[]} defferedPointers 
     * @param {number} flag 
     * @param {Map} additionalData 
     */
    decode(ndr, defferedPointers, flag, additionalData) {
        //shallowClone();
        flag = flag | this.flags;

        let retVal = new Pointer();
        retVal.setFlags(this.flags);
        retVal._isNull = this._isNull;
        retVal.nullSpecial = this.nullSpecial;

        //retVal.isDeffered = isDeffered;
        if (this.isDeffered || (flag & Flags.FLAG_REPRESENTATION_ARRAY) == Flags.FLAG_REPRESENTATION_ARRAY) {
            retVal.referentId = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.INTEGER), defferedPointers, flag, additionalData);
            retVal.referent = this.referent; //will only be the class or object
            if (retVal.referentId == 0 && !this.nullSpecial) {
                //null pointer
                // just return
                retVal._isNull = true;
                retVal.isDeffered = false;
                return retVal;
            }

            retVal.isDeffered = false;
            retVal.isReferenceTypePtr = true;
            defferedPointers.push(retVal);
            return retVal;
        }

        if (!this.isReferenceTypePtr) {
            //referentId = ndr.readUnsignedLong();
            retVal.referentId = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.INTEGER), defferedPointers, flag, additionalData)
            retVal.referent = this.referent; //will only be the class or object
            if (retVal.referentId == 0 && !this.nullSpecial) {
                //null pointer
                // just return
                retVal._isNull = true;
                return retVal;
            }
        }


        retVal.referent = MarshalUnMarshalHelper.deSerialize(ndr, this.referent, defferedPointers, flag, additionalData);
        return retVal;
    }

    /**
     * 
     * @param {boolean} deffered 
     */
    setDeffered(deffered) {
        this.isDeffered = deffered;
    }

    getDeffered() {
        return this.isDeffered;
    }

    /**
     * 
     * @param {number} referent 
     */
    setReferent(referent) {
        this.referentId = referent;
    }

	/** Returns status whether this is a reference type pointer or not.
	 *
	 * @return <code>true</code> if this is a reference type pointer.
	 */
    isReference() {
        return this.isReferenceTypePtr;
    }

	/** Returns the referent identifier.
	 *
	 * @return
	 */
    getReferentIdentifier() {
        return this.referentId;
    }

    /**
     * @exclude
     * @return
     */
    getLength() {
        if (this._isNull) {
            return 4;
        }
        //4 for pointer
        return 4 + MarshalUnMarshalHelper.getLengthInBytes(this.referent, Flags.FLAG_NULL);
    }

    /**
     * 
     * @param {Pointer} replacement
     */
    replaceSelfWithNewPointer(replacement) {
        this.isDeffered = replacement.isDeffered;
        this._isNull = replacement._isNull;
        this.isReferenceTypePtr = replacement.isReferenceTypePtr;
        this.referent = replacement.referent;
    }

	/** Returns status if this pointer is <code>null</code>.
	 *
	 * @return <code>true</code> if the pointer is <code>null</code>.
	 */
    isNull() {
        return this._isNull;
    }

    /**
     * @param {ComValue} value 
     */
    setValue(value) {
        this.referent = value;
    }

    toString() {
        return this.referent == null ? "[null]" : "[" + this.referent.toString() + "]";
    }
}

module.exports = Pointer;