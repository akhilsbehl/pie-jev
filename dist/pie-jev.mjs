import { Text } from "@earendil-works/pi-tui";
//#region node_modules/typebox/build/system/memory/metrics.mjs
/** TypeBox instantiation metrics */
const Metrics = {
	assign: 0,
	create: 0,
	clone: 0,
	discard: 0,
	update: 0
};
//#endregion
//#region node_modules/typebox/build/guard/guard.mjs
/** Returns true if this value is an array */
function IsArray$1(value) {
	return Array.isArray(value);
}
/** Returns true if this value is bigint */
function IsBigInt$1(value) {
	return IsEqual(typeof value, "bigint");
}
/** Returns true if this value is a boolean */
function IsBoolean$1(value) {
	return IsEqual(typeof value, "boolean");
}
/** Returns true if this value is null */
function IsNull$1(value) {
	return IsEqual(value, null);
}
/** Returns true if this value is number */
function IsNumber$1(value) {
	return Number.isFinite(value);
}
/** Returns true if this value is an object but not an array */
function IsObjectNotArray(value) {
	return IsObject$1(value) && !IsArray$1(value);
}
/** Returns true if this value is an object */
function IsObject$1(value) {
	return IsEqual(typeof value, "object") && !IsNull$1(value);
}
/** Returns true if this value is string */
function IsString$1(value) {
	return IsEqual(typeof value, "string");
}
function IsEqual(left, right) {
	return left === right;
}
function IsGreaterThan(left, right) {
	return left > right;
}
function IsLessThan(left, right) {
	return left < right;
}
/** Returns true if the value appears to be an instance of a class. */
function IsClassInstance(value) {
	if (!IsObject$1(value)) return false;
	const proto = globalThis.Object.getPrototypeOf(value);
	if (IsNull$1(proto)) return false;
	return IsEqual(typeof proto.constructor, "function") && !(IsEqual(proto.constructor, globalThis.Object) || IsEqual(proto.constructor.name, "Object"));
}
/** Shifts the left-most element from an array and dispatches to the true arm, or the false arm if empty */
function ShiftLeft(array, true_, false_) {
	return IsEqual(array.length, 0) ? false_() : true_(array[0], array.slice(1));
}
/** Returns true if the PropertyKey is Unsafe (ref: prototype-pollution). */
function IsUnsafePropertyKey(key) {
	return IsEqual(key, "__proto__") || IsEqual(key, "constructor") || IsEqual(key, "prototype");
}
/** Returns true if this value has this property key */
function HasPropertyKey(value, key) {
	return IsUnsafePropertyKey(key) ? Object.prototype.hasOwnProperty.call(value, key) : key in value;
}
/** Returns property keys for this object via `Object.getOwnPropertyNames({ ... })` */
function Keys(value) {
	return Object.getOwnPropertyNames(value);
}
/** Returns the property keys for this object via `Object.getOwnPropertySymbols({ ... })` */
function Symbols(value) {
	return Object.getOwnPropertySymbols(value);
}
/** Returns the property values for the given object via `Object.values()` */
function Values(value) {
	return Object.values(value);
}
//#endregion
//#region node_modules/typebox/build/guard/globals.mjs
function IsTypeArray(value) {
	return globalThis.ArrayBuffer.isView(value);
}
/** Returns true if the value is a RegExp */
function IsRegExp(value) {
	return value instanceof globalThis.RegExp;
}
/** Returns true if the value is a Set */
function IsSet(value) {
	return value instanceof globalThis.Set;
}
/** Returns true if the value is a Map */
function IsMap(value) {
	return value instanceof globalThis.Map;
}
//#endregion
//#region node_modules/typebox/build/system/settings/settings.mjs
const settings = {
	immutableTypes: false,
	maxErrors: 8,
	maxParseErrors: 1,
	maxInstantiationCount: 128,
	useAcceleration: true,
	exactOptionalPropertyTypes: false,
	enumerableKind: false,
	correctiveParse: false,
	unionPrioritySort: true
};
/** Gets current system settings */
function Get() {
	return settings;
}
//#endregion
//#region node_modules/typebox/build/system/memory/freeze.mjs
/** Conditionally freezes the value if `immutableTypes` is true, otherwise no action. */
function Freeze(value) {
	return Get().immutableTypes ? Object.freeze(value) : value;
}
//#endregion
//#region node_modules/typebox/build/system/memory/assign.mjs
/**
* Performs an Object assign using the Left and Right object types. We track this operation as it
* creates a new GC handle per assignment.
*/
function Assign(left, right) {
	Metrics.assign += 1;
	return Freeze({
		...left,
		...right
	});
}
//#endregion
//#region node_modules/typebox/build/system/memory/clone.mjs
function FromClassInstance(value) {
	return value;
}
function IsSchemaObject(value) {
	return HasPropertyKey(value, "~kind") || HasPropertyKey(value, "~unsafe");
}
function FromSchemaObject(value) {
	const result = {};
	for (const key of Keys(value)) {
		if (IsUnsafePropertyKey(key)) continue;
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		descriptor.value = FromValue(descriptor.value);
		if (IsEqual(descriptor.enumerable, true)) result[key] = descriptor.value;
		else Object.defineProperty(result, key, descriptor);
	}
	return result;
}
function FromPlainObject(value) {
	const result = {};
	for (const key of Keys(value)) {
		if (IsUnsafePropertyKey(key)) continue;
		result[key] = FromValue(value[key]);
	}
	for (const key of Symbols(value)) result[key] = FromValue(value[key]);
	return result;
}
function FromObject$7(value) {
	return IsClassInstance(value) ? FromClassInstance(value) : IsSchemaObject(value) ? FromSchemaObject(value) : FromPlainObject(value);
}
function FromArray$3(value) {
	return value.map((element) => FromValue(element));
}
function FromTypedArray(value) {
	return value.slice();
}
function FromRegExp(value) {
	return new RegExp(value.source, value.flags);
}
function FromMap(value) {
	return new Map(FromValue([...value.entries()]));
}
function FromSet(value) {
	return new Set(FromValue([...value.values()]));
}
function FromValue(value) {
	return IsTypeArray(value) ? FromTypedArray(value) : IsRegExp(value) ? FromRegExp(value) : IsMap(value) ? FromMap(value) : IsSet(value) ? FromSet(value) : IsArray$1(value) ? FromArray$3(value) : IsObject$1(value) ? FromObject$7(value) : value;
}
/**
* Returns a Clone of the given value. This function is similar to structuredClone()
* but also supports deep cloning instances of Map, Set and TypeArray.
*/
function Clone(value) {
	Metrics.clone += 1;
	return FromValue(value);
}
//#endregion
//#region node_modules/typebox/build/system/memory/create.mjs
function MergeHidden(left, right) {
	for (const key of Object.keys(right)) Object.defineProperty(left, key, {
		configurable: true,
		writable: true,
		enumerable: false,
		value: right[key]
	});
	return left;
}
function Merge(left, right) {
	return {
		...left,
		...right
	};
}
/**
* Creates an object with hidden, enumerable, and optional property sets. This function
* ensures types are instantiated according to configuration rules for enumerable and
* non-enumerable properties.
*/
function Create(hidden, enumerable, options = {}) {
	Metrics.create += 1;
	const withOptions = Merge(enumerable, options);
	return Freeze(Get().enumerableKind ? Merge(withOptions, hidden) : MergeHidden(withOptions, hidden));
}
//#endregion
//#region node_modules/typebox/build/system/memory/discard.mjs
/** Discards multiple property keys from the given object value */
function Discard(value, propertyKeys) {
	Metrics.discard += 1;
	const result = {};
	for (const key of Keys(value)) {
		if (propertyKeys.includes(key)) continue;
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		descriptor.value = Clone(descriptor.value);
		Object.defineProperty(result, key, descriptor);
	}
	return Freeze(result);
}
//#endregion
//#region node_modules/typebox/build/system/memory/update.mjs
/**
* Updates a value with new properties while preserving property enumerability. Use this function to modify
* existing types without altering their configuration.
*/
function Update(current, hidden, enumerable) {
	Metrics.update += 1;
	const settings = Get();
	const result = Clone(current);
	for (const key of Object.keys(hidden)) Object.defineProperty(result, key, {
		configurable: true,
		writable: true,
		enumerable: settings.enumerableKind,
		value: hidden[key]
	});
	for (const key of Object.keys(enumerable)) Object.defineProperty(result, key, {
		configurable: true,
		enumerable: true,
		writable: true,
		value: enumerable[key]
	});
	return Freeze(result);
}
//#endregion
//#region node_modules/typebox/build/type/types/schema.mjs
function IsKind(value, kind) {
	return IsObject$1(value) && HasPropertyKey(value, "~kind") && IsEqual(value["~kind"], kind);
}
function IsSchema(value) {
	return IsObject$1(value);
}
//#endregion
//#region node_modules/typebox/build/type/types/deferred.mjs
/** Creates a Deferred action. */
function Deferred(action, parameters, options) {
	return Create({ "~kind": "Deferred" }, {
		type: "deferred",
		action,
		parameters,
		options
	}, {});
}
/** Returns true if the given value is a TDeferred. */
function IsDeferred(value) {
	return IsKind(value, "Deferred");
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly/instantiate_add.mjs
function AddReadonlyOperation(type) {
	return Update(type, { "~readonly": true }, {});
}
function AddReadonlyAction(type, options) {
	return Update(AddReadonlyOperation(type), {}, options);
}
function AddReadonlyInstantiate(context, state, type, options) {
	return AddReadonlyAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/optional/instantiate_add.mjs
function AddOptionalOperation(type) {
	return Update(type, { "~optional": true }, {});
}
function AddOptionalAction(type, options) {
	return Update(AddOptionalOperation(type), {}, options);
}
function AddOptionalInstantiate(context, state, type, options) {
	return AddOptionalAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/types/array.mjs
/** Creates an Array type. */
function _Array_(items, options) {
	return Create({ "~kind": "Array" }, {
		type: "array",
		items
	}, options);
}
/** Returns true if the given value is a TArray. */
function IsArray(value) {
	return IsKind(value, "Array");
}
/** Extracts options from a TArray. */
function ArrayOptions(type) {
	return Discard(type, [
		"~kind",
		"type",
		"items"
	]);
}
//#endregion
//#region node_modules/typebox/build/type/types/constructor.mjs
/** Creates a Constructor type. */
function Constructor(parameters, instanceType, options = {}) {
	return Create({ "~kind": "Constructor" }, {
		type: "constructor",
		parameters,
		instanceType
	}, options);
}
/** Returns true if the given value is a TConstructor. */
function IsConstructor(value) {
	return IsKind(value, "Constructor");
}
/** Extracts options from a TConstructor. */
function ConstructorOptions(type) {
	return Discard(type, [
		"~kind",
		"type",
		"parameters",
		"instanceType"
	]);
}
//#endregion
//#region node_modules/typebox/build/type/types/function.mjs
/** Creates a Function type. */
function _Function_(parameters, returnType, options = {}) {
	return Create({ ["~kind"]: "Function" }, {
		type: "function",
		parameters,
		returnType
	}, options);
}
/** Returns true if the given value is TFunction. */
function IsFunction(value) {
	return IsKind(value, "Function");
}
/** Extracts options from a TFunction. */
function FunctionOptions(type) {
	return Discard(type, [
		"~kind",
		"type",
		"parameters",
		"returnType"
	]);
}
//#endregion
//#region node_modules/typebox/build/type/types/ref.mjs
/** Creates a Ref type. */
function Ref(ref, options) {
	return Create({ ["~kind"]: "Ref" }, { $ref: ref }, options);
}
/** Returns true if the given value is TRef. */
function IsRef(value) {
	return IsKind(value, "Ref");
}
//#endregion
//#region node_modules/typebox/build/type/types/generic.mjs
/** Creates a Generic type. */
function Generic(parameters, expression) {
	return Create({ "~kind": "Generic" }, {
		type: "generic",
		parameters,
		expression
	});
}
/** Returns true if the given value is a TGeneric. */
function IsGeneric(value) {
	return IsKind(value, "Generic");
}
//#endregion
//#region node_modules/typebox/build/type/types/any.mjs
/** Creates a Any type. */
function Any(options) {
	return Create({ ["~kind"]: "Any" }, {}, options);
}
/** Returns true if the given value is a TAny. */
function IsAny(value) {
	return IsKind(value, "Any");
}
//#endregion
//#region node_modules/typebox/build/type/types/never.mjs
const NeverPattern = "(?!)";
/** Creates a Never type. */
function Never(options) {
	return Create({ "~kind": "Never" }, { not: {} }, options);
}
/** Returns true if the given value is TNever. */
function IsNever(value) {
	return IsKind(value, "Never");
}
//#endregion
//#region node_modules/typebox/build/type/action/_add_optional.mjs
/** Applies an AddOptional action to a type. */
function AddOptional(type, options = {}) {
	return AddOptionalAction(type, options);
}
//#endregion
//#region node_modules/typebox/build/type/types/_optional.mjs
/** Returns true if the given value is TOptional */
function IsOptional(value) {
	return IsSchema(value) && HasPropertyKey(value, "~optional");
}
//#endregion
//#region node_modules/typebox/build/type/types/properties.mjs
/** Creates a RequiredArray derived from the given TProperties value. */
function RequiredArray(properties) {
	return Keys(properties).filter((key) => !IsOptional(properties[key]));
}
/** Extracts a tuple of keys from a TProperties value. */
function PropertyKeys(properties) {
	return Keys(properties);
}
/** Extracts a tuple of property values from a TProperties value. */
function PropertyValues(properties) {
	return Values(properties);
}
//#endregion
//#region node_modules/typebox/build/type/types/object.mjs
/** Creates an Object type. */
function _Object_(properties, options = {}) {
	const requiredKeys = RequiredArray(properties);
	return Create({ "~kind": "Object" }, {
		type: "object",
		...requiredKeys.length > 0 ? { required: requiredKeys } : {},
		properties
	}, options);
}
/** Returns true if the given value is TObject. */
function IsObject(value) {
	return IsKind(value, "Object");
}
/** Extracts options from a TObject. */
function ObjectOptions(type) {
	return Discard(type, [
		"~kind",
		"type",
		"properties",
		"required"
	]);
}
//#endregion
//#region node_modules/typebox/build/type/types/unknown.mjs
/** Creates an Unknown type. */
function Unknown(options) {
	return Create({ ["~kind"]: "Unknown" }, {}, options);
}
/** Returns true if the given value is TUnknown. */
function IsUnknown(value) {
	return IsKind(value, "Unknown");
}
//#endregion
//#region node_modules/typebox/build/type/types/cyclic.mjs
/** Creates a Cyclic type. */
function Cyclic($defs, $ref, options) {
	const defs = Keys($defs).reduce((result, key) => {
		return {
			...result,
			[key]: Update($defs[key], {}, { $id: key })
		};
	}, {});
	return Create({ ["~kind"]: "Cyclic" }, {
		$defs: defs,
		$ref
	}, options);
}
/** Returns true if the given value is a TCyclic. */
function IsCyclic(value) {
	return IsKind(value, "Cyclic");
}
//#endregion
//#region node_modules/typebox/build/type/types/unsafe.mjs
/** Returns true if the given value is TUnsafe. */
function IsUnsafe(value) {
	return IsObjectNotArray(value) && HasPropertyKey(value, "~unsafe") && IsNull$1(value["~unsafe"]);
}
//#endregion
//#region node_modules/typebox/build/type/types/infer.mjs
/** Returns true if the given value is TInfer. */
function IsInfer(value) {
	return IsKind(value, "Infer");
}
//#endregion
//#region node_modules/typebox/build/type/types/dependent.mjs
/** Creates a Dependent type */
function Dependent(if_, then_, else_, options = {}) {
	return Create({ "~kind": "Dependent" }, {
		if: if_,
		then: then_,
		else: else_
	}, options);
}
/** Returns true if the given value is TDependent. */
function IsDependent(value) {
	return IsKind(value, "Dependent");
}
/** Extracts options from a IsDependent. */
function DependentOptions(type) {
	return Discard(type, [
		"~kind",
		"if",
		"then",
		"else"
	]);
}
//#endregion
//#region node_modules/typebox/build/type/types/enum.mjs
/** Returns true if the given value is a TEnum. */
function IsEnum(value) {
	return IsKind(value, "Enum");
}
//#endregion
//#region node_modules/typebox/build/type/types/intersect.mjs
/** Creates a Intersect type. */
function Intersect(types, options = {}) {
	return Create({ "~kind": "Intersect" }, { allOf: types }, options);
}
/** Returns true if the given value is TIntersect. */
function IsIntersect(value) {
	return IsKind(value, "Intersect");
}
/** Extracts options from a TIntersect. */
function IntersectOptions(type) {
	return Discard(type, ["~kind", "allOf"]);
}
//#endregion
//#region node_modules/typebox/build/system/unreachable/unreachable.mjs
/** Used for unreachable logic */
function Unreachable() {
	throw new Error("Unreachable");
}
//#endregion
//#region node_modules/typebox/build/system/hashing/hash.mjs
var ByteMarker;
(function(ByteMarker) {
	ByteMarker[ByteMarker["Array"] = 0] = "Array";
	ByteMarker[ByteMarker["BigInt"] = 1] = "BigInt";
	ByteMarker[ByteMarker["Boolean"] = 2] = "Boolean";
	ByteMarker[ByteMarker["Date"] = 3] = "Date";
	ByteMarker[ByteMarker["Constructor"] = 4] = "Constructor";
	ByteMarker[ByteMarker["Function"] = 5] = "Function";
	ByteMarker[ByteMarker["Null"] = 6] = "Null";
	ByteMarker[ByteMarker["Number"] = 7] = "Number";
	ByteMarker[ByteMarker["Object"] = 8] = "Object";
	ByteMarker[ByteMarker["RegExp"] = 9] = "RegExp";
	ByteMarker[ByteMarker["String"] = 10] = "String";
	ByteMarker[ByteMarker["Symbol"] = 11] = "Symbol";
	ByteMarker[ByteMarker["TypeArray"] = 12] = "TypeArray";
	ByteMarker[ByteMarker["Undefined"] = 13] = "Undefined";
})(ByteMarker || (ByteMarker = {}));
Array.from({ length: 256 }).map((_, i) => BigInt(i));
const F64 = /* @__PURE__ */ new Float64Array(1);
new DataView(F64.buffer);
new Uint8Array(F64.buffer);
new TextEncoder();
//#endregion
//#region node_modules/typebox/build/type/types/_immutable.mjs
/** Returns true if the given value is a TImmutable */
function IsImmutable(value) {
	return IsSchema(value) && HasPropertyKey(value, "~immutable");
}
//#endregion
//#region node_modules/typebox/build/type/action/_add_readonly.mjs
/** Applies an AddReadonly action to a type. */
function AddReadonly(type, options = {}) {
	return AddReadonlyAction(type, options);
}
//#endregion
//#region node_modules/typebox/build/type/types/_readonly.mjs
/** Returns true if the given value is a TReadonly */
function IsReadonly(value) {
	return IsSchema(value) && HasPropertyKey(value, "~readonly");
}
//#endregion
//#region node_modules/typebox/build/type/types/bigint.mjs
const BigIntPattern = "-?(?:0|[1-9][0-9]*)n";
/** Creates a BigInt type. */
function BigInt$1(options) {
	return Create({ "~kind": "BigInt" }, { type: "bigint" }, options);
}
/** Returns true if the given value is a TBigInt. */
function IsBigInt(value) {
	return IsKind(value, "BigInt");
}
//#endregion
//#region node_modules/typebox/build/type/types/boolean.mjs
/** Returns true if the given value is a TBoolean. */
function IsBoolean(value) {
	return IsKind(value, "Boolean");
}
//#endregion
//#region node_modules/typebox/build/type/types/integer.mjs
const IntegerPattern = "-?(?:0|[1-9][0-9]*)";
/** Creates a Integer type. */
function Integer(options) {
	return Create({ "~kind": "Integer" }, { type: "integer" }, options);
}
/** Returns true if the given value is TInteger. */
function IsInteger(value) {
	return IsKind(value, "Integer");
}
//#endregion
//#region node_modules/typebox/build/type/types/literal.mjs
var InvalidLiteralValue = class extends Error {
	constructor(value) {
		super(`Invalid Literal value`);
		Object.defineProperty(this, "cause", {
			value: { value },
			writable: false,
			configurable: false,
			enumerable: false
		});
	}
};
function LiteralTypeName(value) {
	return IsBigInt$1(value) ? "bigint" : IsBoolean$1(value) ? "boolean" : IsNumber$1(value) ? "number" : IsString$1(value) ? "string" : (() => {
		throw new InvalidLiteralValue(value);
	})();
}
/** Creates a Literal type. */
function Literal(value, options) {
	return Create({ "~kind": "Literal" }, {
		type: LiteralTypeName(value),
		const: value
	}, options);
}
/** Returns true if the given value is a TLiteralValue. */
function IsLiteralValue(value) {
	return IsBigInt$1(value) || IsBoolean$1(value) || IsNumber$1(value) || IsString$1(value);
}
/** Returns true if the given value is TLiteral<number>. */
function IsLiteralNumber(value) {
	return IsLiteral(value) && IsNumber$1(value.const);
}
/** Returns true if the given value is TLiteral<string>. */
function IsLiteralString(value) {
	return IsLiteral(value) && IsString$1(value.const);
}
/** Returns true if the given value is TLiteral. */
function IsLiteral(value) {
	return IsKind(value, "Literal");
}
//#endregion
//#region node_modules/typebox/build/type/types/null.mjs
/** Creates a Null type. */
function Null(options) {
	return Create({ "~kind": "Null" }, { type: "null" }, options);
}
/** Returns true if the given value is TNull. */
function IsNull(value) {
	return IsKind(value, "Null");
}
//#endregion
//#region node_modules/typebox/build/type/types/number.mjs
const NumberPattern = "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?";
/** Creates a Number type. */
function Number$1(options) {
	return Create({ "~kind": "Number" }, { type: "number" }, options);
}
/** Returns true if the given value is a TNumber. */
function IsNumber(value) {
	return IsKind(value, "Number");
}
//#endregion
//#region node_modules/typebox/build/type/types/symbol.mjs
/** Creates a Symbol type. */
function Symbol(options) {
	return Create({ "~kind": "Symbol" }, { type: "symbol" }, options);
}
/** Returns true if the given value is TSymbol. */
function IsSymbol(value) {
	return IsKind(value, "Symbol");
}
//#endregion
//#region node_modules/typebox/build/type/types/string.mjs
/** Creates a String type. */
function String$1(options) {
	return Create({ "~kind": "String" }, { type: "string" }, options);
}
/** Returns true if the given value is TString. */
function IsString(value) {
	return IsKind(value, "String");
}
//#endregion
//#region node_modules/typebox/build/type/types/union.mjs
/** Creates a Union type. */
function Union(anyOf, options = {}) {
	return Create({ "~kind": "Union" }, { anyOf }, options);
}
/** Returns true if the given value is TUnion. */
function IsUnion(value) {
	return IsKind(value, "Union");
}
/** Extracts options from a TUnion. */
function UnionOptions(type) {
	return Discard(type, ["~kind", "anyOf"]);
}
//#endregion
//#region node_modules/typebox/build/type/engine/patterns/pattern.mjs
/** Parses a Pattern into a sequence of TemplateLiteral types. A result of [] indicates failure to parse. */
function ParsePatternIntoTypes(pattern) {
	const parsed = Pattern(pattern);
	return IsEqual(parsed.length, 2) ? parsed[0] : [];
}
//#endregion
//#region node_modules/typebox/build/type/engine/template_literal/is_finite.mjs
function FromLiteral$4(_value) {
	return true;
}
function FromTypesReduce(types) {
	return ShiftLeft(types, (left, right) => FromType$17(left) ? FromTypesReduce(right) : false, () => true);
}
function FromTypes$4(types) {
	return IsEqual(types.length, 0) ? false : FromTypesReduce(types);
}
function FromType$17(type) {
	return IsUnion(type) ? FromTypes$4(type.anyOf) : IsLiteral(type) ? FromLiteral$4(type.const) : false;
}
/** Returns true if the given TemplateLiteral types yields a finite variant set */
function IsTemplateLiteralFinite(types) {
	return FromTypes$4(types);
}
//#endregion
//#region node_modules/typebox/build/type/engine/template_literal/create.mjs
function TemplateLiteralCreate(pattern) {
	return Create({ ["~kind"]: "TemplateLiteral" }, {
		type: "string",
		pattern
	}, {});
}
//#endregion
//#region node_modules/typebox/build/type/engine/template_literal/decode.mjs
function FromLiteralPush(variants, value, result = []) {
	return ShiftLeft(variants, (left, right) => FromLiteralPush(right, value, [...result, `${left}${value}`]), () => result);
}
function FromLiteral$3(variants, value) {
	return IsEqual(variants.length, 0) ? [`${value}`] : FromLiteralPush(variants, value);
}
function FromUnion$7(variants, types, result = []) {
	return ShiftLeft(types, (left, right) => FromUnion$7(variants, right, [...result, ...FromType$16(variants, left)]), () => result);
}
function FromType$16(variants, type) {
	return IsUnion(type) ? FromUnion$7(variants, type.anyOf) : IsLiteral(type) ? FromLiteral$3(variants, type.const) : Unreachable();
}
function DecodeFromSpan(variants, types) {
	return ShiftLeft(types, (left, right) => DecodeFromSpan(FromType$16(variants, left), right), () => variants);
}
function VariantsToLiterals(variants) {
	return variants.map((variant) => Literal(variant));
}
function DecodeTypesAsUnion(types) {
	return Union(VariantsToLiterals(DecodeFromSpan([], types)));
}
function DecodeTypes(types) {
	return IsEqual(types.length, 0) ? Unreachable() : IsEqual(types.length, 1) && IsLiteral(types[0]) ? types[0] : DecodeTypesAsUnion(types);
}
/**
* (Internal) Decodes a TemplateLiteral pattern into a Type. This function is unsafe. Decoding a non-finite
* TemplateLiteral pattern may produce another TemplateLiteral pattern. During enumeration, this
* TemplateLiteral -> TemplateLiteral behavior can cause a StackOverflow. A better in-flight template-literal
* decoding algorithm is needed. (for review)
*/
function TemplateLiteralDecodeUnsafe(pattern) {
	const types = ParsePatternIntoTypes(pattern);
	return IsEqual(types.length, 0) ? String$1() : IsTemplateLiteralFinite(types) ? DecodeTypes(types) : TemplateLiteralCreate(pattern);
}
/** Decodes a TemplateLiteral pattern but returns TString if the pattern in non-finite. */
function TemplateLiteralDecode(pattern) {
	const decoded = TemplateLiteralDecodeUnsafe(pattern);
	return IsTemplateLiteral(decoded) ? String$1() : decoded;
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/record_create.mjs
function CreateRecord(key, value) {
	const type = "object";
	const patternProperties = { [key]: value };
	return Create({ ["~kind"]: "Record" }, {
		type,
		patternProperties
	});
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_any.mjs
function FromAnyKey(value) {
	return CreateRecord(StringKey, value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_boolean.mjs
function FromBooleanKey(value) {
	return _Object_({
		true: value,
		false: value
	});
}
//#endregion
//#region node_modules/typebox/build/type/types/tuple.mjs
/** Creates a Tuple type. */
function Tuple(types, options = {}) {
	const [items, minItems, additionalItems] = [
		types,
		types.length,
		false
	];
	return Create({ ["~kind"]: "Tuple" }, {
		type: "array",
		additionalItems,
		items,
		minItems
	}, options);
}
/** Returns true if the given value is TTuple. */
function IsTuple(value) {
	return IsKind(value, "Tuple");
}
/** Extracts options from a TTuple. */
function TupleOptions(type) {
	return Discard(type, [
		"~kind",
		"type",
		"items",
		"minItems",
		"additionalItems"
	]);
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly/instantiate_remove.mjs
function RemoveReadonlyOperation(type) {
	return Discard(type, ["~readonly"]);
}
function RemoveReadonlyAction(type, options) {
	return Update(RemoveReadonlyOperation(type), {}, options);
}
function RemoveReadonlyInstantiate(context, state, type, options) {
	return RemoveReadonlyAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/_remove_readonly.mjs
/** Applies an RemoveReadonly action to a type. */
function RemoveReadonly(type, options = {}) {
	return RemoveReadonlyAction(type, options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/optional/instantiate_remove.mjs
function RemoveOptionalOperation(type) {
	return Discard(type, ["~optional"]);
}
function RemoveOptionalAction(type, options) {
	return Update(RemoveOptionalOperation(type), {}, options);
}
function RemoveOptionalInstantiate(context, state, type, options) {
	return RemoveOptionalAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/_remove_optional.mjs
/** Applies an RemoveOptional action to a type. */
function RemoveOptional(type, options = {}) {
	return RemoveOptionalAction(type, options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/tuple/to_object.mjs
function TupleElementsToProperties(types) {
	return types.reduceRight((result, right, index) => {
		return {
			[index]: right,
			...result
		};
	}, {});
}
function TupleToObject(type) {
	return _Object_(TupleElementsToProperties(type.items));
}
//#endregion
//#region node_modules/typebox/build/type/engine/evaluate/composite.mjs
/** Returns true if the type is a valid operand to Composite. */
function CanComposite(type) {
	return IsObject(type) || IsTuple(type);
}
function IsReadonlyProperty(left, right) {
	return IsReadonly(left) ? IsReadonly(right) ? true : false : false;
}
function IsOptionalProperty(left, right) {
	return IsOptional(left) ? IsOptional(right) ? true : false : false;
}
function CompositeProperty(left, right) {
	const isReadonly = IsReadonlyProperty(left, right);
	const isOptional = IsOptionalProperty(left, right);
	const property = RemoveReadonly(RemoveOptional(EvaluateIntersect([left, right])));
	return isReadonly && isOptional ? AddReadonly(AddOptional(property)) : isReadonly && !isOptional ? AddReadonly(property) : !isReadonly && isOptional ? AddOptional(property) : property;
}
function CompositePropertyKey(left, right, key) {
	return key in left ? key in right ? CompositeProperty(left[key], right[key]) : left[key] : key in right ? right[key] : Never();
}
function CompositeProperties(left, right) {
	return [.../* @__PURE__ */ new Set([...Keys(left), ...Keys(right)])].reduce((result, key) => {
		return {
			...result,
			[key]: CompositePropertyKey(left, right, key)
		};
	}, {});
}
function GetProperties(type) {
	return IsObject(type) ? type.properties : IsTuple(type) ? TupleElementsToProperties(type.items) : {};
}
function Composite(left, right) {
	return _Object_(CompositeProperties(GetProperties(left), GetProperties(right)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/evaluate/narrow.mjs
function NarrowCompareRule(left, right) {
	const result = Compare(left, right);
	return IsEqual(result, 2) ? left : IsEqual(result, 3) ? right : IsEqual(result, 0) ? right : Never();
}
function NarrowCompositeRule(left, right) {
	const canCompositeLeft = CanComposite(left);
	const canCompositeRight = CanComposite(right);
	return canCompositeLeft && canCompositeRight ? Composite(left, right) : canCompositeLeft && !canCompositeRight ? left : !canCompositeLeft && canCompositeRight ? right : NarrowCompareRule(left, right);
}
function Narrow(left, right) {
	return IsNever(left) ? left : IsAny(left) ? left : IsUnknown(left) ? right : IsNever(right) ? right : IsAny(right) ? right : IsUnknown(right) ? left : NarrowCompositeRule(left, right);
}
//#endregion
//#region node_modules/typebox/build/type/engine/evaluate/distribute.mjs
function ShouldEvaluate(left, right) {
	return IsUnion(left) || IsUnion(right);
}
function DistributeOperation(left, right) {
	const evaluatedLeft = EvaluateType(left);
	const evaluatedRight = EvaluateType(right);
	return ShouldEvaluate(evaluatedLeft, evaluatedRight) ? EvaluateIntersect([evaluatedLeft, evaluatedRight]) : Narrow(evaluatedLeft, evaluatedRight);
}
function DistributeType(type, types, result = []) {
	return ShiftLeft(types, (left, right) => DistributeType(type, right, [...result, DistributeOperation(left, type)]), () => IsEqual(result.length, 0) ? [type] : result);
}
function DistributeUnion(types, distribution, result = []) {
	return ShiftLeft(types, (left, right) => DistributeUnion(right, distribution, [...result, ...Distribute$1([left], distribution)]), () => result);
}
function Distribute$1(types, result = []) {
	return ShiftLeft(types, (left, right) => IsUnion(left) ? Distribute$1(right, DistributeUnion(left.anyOf, result)) : Distribute$1(right, DistributeType(left, result)), () => result);
}
//#endregion
//#region node_modules/typebox/build/type/engine/exclude/operation.mjs
function ExcludeType(left, right) {
	return IsExtendsTrueLike(Extends({}, left, right)) ? [] : [left];
}
function ExcludeUnion(left, right, result = []) {
	return ShiftLeft(left, (head, tail) => ExcludeUnion(tail, right, [...result, ...ExcludeType(head, right)]), () => result);
}
function ExcludeOperation(left, right) {
	const evaluated = EvaluateType(left);
	return EvaluateUnion(ExcludeUnion(IsUnion(evaluated) ? evaluated.anyOf : [evaluated], right));
}
//#endregion
//#region node_modules/typebox/build/type/engine/evaluate/evaluate.mjs
function EvaluateDependent(if_, then_, else_) {
	return EvaluateUnion([EvaluateIntersect([if_, then_]), ExcludeOperation(else_, if_)]);
}
function EvaluateEnum(values, result = []) {
	return ShiftLeft(values, (left, right) => EvaluateEnum(right, [...result, Literal(left)]), () => EvaluateUnion(result));
}
function EvaluateIntersect(types) {
	return EvaluateUnion(Broaden(Distribute$1(types)));
}
function EvaluateTemplateLiteral(pattern) {
	return EvaluateType(TemplateLiteralDecode(pattern));
}
function EvaluateUnion(types) {
	return EvaluateUnionFast(Broaden(types));
}
function EvaluateType(type) {
	return IsDependent(type) ? EvaluateDependent(type.if, type.then, type.else) : IsEnum(type) ? EvaluateEnum(type.enum) : IsIntersect(type) ? EvaluateIntersect(type.allOf) : IsTemplateLiteral(type) ? EvaluateTemplateLiteral(type.pattern) : IsUnion(type) ? EvaluateUnion(type.anyOf) : type;
}
function EvaluateUnionFast(types) {
	return IsEqual(types.length, 1) ? types[0] : IsEqual(types.length, 0) ? Never() : Union(types);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_enum.mjs
function FromEnumKey(values, value) {
	return FromKey(EvaluateEnum(values), value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_integer.mjs
function FromIntegerKey(_key, value) {
	return CreateRecord(IntegerKey, value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_intersect.mjs
function FromIntersectKey(types, value) {
	return FromKey(EvaluateIntersect(types), value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_literal.mjs
function FromLiteralKey(key, value) {
	return IsString$1(key) || IsNumber$1(key) ? _Object_({ [key]: value }) : IsEqual(key, false) ? _Object_({ false: value }) : IsEqual(key, true) ? _Object_({ true: value }) : _Object_({});
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_number.mjs
function FromNumberKey(_key, value) {
	return CreateRecord(NumberKey, value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_string.mjs
function FromStringKey(key, value) {
	return HasPropertyKey(key, "pattern") && (IsString$1(key.pattern) || key.pattern instanceof RegExp) ? CreateRecord(key.pattern.toString(), value) : CreateRecord(StringKey, value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_template_literal.mjs
function FromTemplateKey(pattern, value) {
	return IsTemplateLiteralFinite(ParsePatternIntoTypes(pattern)) ? FromKey(EvaluateTemplateLiteral(pattern), value) : CreateRecord(pattern, value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/evaluate/flatten.mjs
function FlattenType(type) {
	return IsUnion(type) ? Flatten(type.anyOf) : [type];
}
function Flatten(types, result = []) {
	return ShiftLeft(types, (left, right) => Flatten(right, [...result, ...FlattenType(left)]), () => result);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key_union.mjs
function StringOrNumberCheck(types) {
	return types.some((type) => IsString(type) || IsNumber(type) || IsInteger(type));
}
function TryBuildRecord(types, value) {
	return IsEqual(StringOrNumberCheck(types), true) ? CreateRecord(StringKey, value) : void 0;
}
function CreateProperties(types, value) {
	return types.reduce((result, left) => {
		return IsLiteral(left) && (IsString$1(left.const) || IsNumber$1(left.const)) ? {
			...result,
			[left.const]: value
		} : result;
	}, {});
}
function CreateObject(types, value) {
	return _Object_(CreateProperties(types, value));
}
function FromUnionKey(types, value) {
	const flattened = Flatten(types);
	const record = TryBuildRecord(flattened, value);
	return IsSchema(record) ? record : CreateObject(flattened, value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/from_key.mjs
function FromKey(key, value) {
	return IsAny(key) ? FromAnyKey(value) : IsBoolean(key) ? FromBooleanKey(value) : IsEnum(key) ? FromEnumKey(key.enum, value) : IsInteger(key) ? FromIntegerKey(key, value) : IsIntersect(key) ? FromIntersectKey(key.allOf, value) : IsLiteral(key) ? FromLiteralKey(key.const, value) : IsNumber(key) ? FromNumberKey(key, value) : IsUnion(key) ? FromUnionKey(key.anyOf, value) : IsString(key) ? FromStringKey(key, value) : IsTemplateLiteral(key) ? FromTemplateKey(key.pattern, value) : _Object_({});
}
//#endregion
//#region node_modules/typebox/build/type/engine/record/instantiate.mjs
function RecordAction(key, value, options) {
	return CanInstantiate([key]) ? Update(FromKey(key, value), {}, options) : RecordDeferred(key, value, options);
}
function RecordInstantiate(context, state, key, value, options) {
	return RecordAction(InstantiateType(context, state, key), InstantiateType(context, state, value), options);
}
//#endregion
//#region node_modules/typebox/build/type/types/record.mjs
const IntegerKey = `^${IntegerPattern}$`;
const NumberKey = `^${NumberPattern}$`;
const StringKey = `^.*$`;
/** Represents a deferred Record action. */
function RecordDeferred(key, value, options = {}) {
	return Deferred("Record", [key, value], options);
}
/** Creates a Record type. */
function Record(key, value, options = {}) {
	return RecordAction(key, value, options);
}
/** Creates a Record type from regular expression pattern. */
function RecordFromPattern(pattern, value) {
	return CreateRecord(pattern, value);
}
/** Transforms a Record Pattern to a Type */
function RecordPatternToType(pattern) {
	return IsEqual(pattern, StringKey) ? String$1() : IsEqual(pattern, IntegerKey) ? Integer() : IsEqual(pattern, NumberKey) ? Number$1() : TemplateLiteralDecodeUnsafe(pattern);
}
/** Extracts the Pattern from a Record type */
function RecordPattern(type) {
	return Keys(type.patternProperties)[0];
}
/** Extracts the Key from a Record type */
function RecordKey(type) {
	return RecordPatternToType(RecordPattern(type));
}
/** Extracts the Value from a Record type */
function RecordValue(type) {
	return type.patternProperties[RecordPattern(type)];
}
function IsRecord(value) {
	return IsKind(value, "Record");
}
//#endregion
//#region node_modules/typebox/build/type/types/rest.mjs
/** Creates a Rest instruction type. */
function Rest(type) {
	return Create({ "~kind": "Rest" }, {
		type: "rest",
		items: type
	}, {});
}
/** Returns true if the given value is TRest. */
function IsRest(value) {
	return IsKind(value, "Rest");
}
//#endregion
//#region node_modules/typebox/build/type/types/this.mjs
/** Returns true if the given value is TThis. */
function IsThis(value) {
	return IsKind(value, "This");
}
//#endregion
//#region node_modules/typebox/build/type/types/undefined.mjs
/** Creates a Undefined type. */
function Undefined(options) {
	return Create({ "~kind": "Undefined" }, { type: "undefined" }, options);
}
/** Returns true if the given value is TUndefined. */
function IsUndefined(value) {
	return IsKind(value, "Undefined");
}
//#endregion
//#region node_modules/typebox/build/type/types/void.mjs
/** Returns true if the given value is TVoid. */
function IsVoid(value) {
	return IsKind(value, "Void");
}
//#endregion
//#region node_modules/typebox/build/type/script/mapping.mjs
function PatternBigIntMapping(input) {
	return BigInt$1();
}
function PatternStringMapping(input) {
	return String$1();
}
function PatternNumberMapping(input) {
	return Number$1();
}
function PatternIntegerMapping(input) {
	return Integer();
}
function PatternNeverMapping(input) {
	return Never();
}
function PatternTextMapping(input) {
	return Literal(input);
}
function PatternBaseMapping(input) {
	return input;
}
function PatternGroupMapping(input) {
	return Union(input[1]);
}
function PatternUnionMapping(input) {
	return input.length === 3 ? [...input[0], ...input[2]] : input.length === 1 ? [...input[0]] : [];
}
function PatternTermMapping(input) {
	return [input[0], ...input[1]];
}
function PatternBodyMapping(input) {
	return input;
}
function PatternMapping(input) {
	return input[1];
}
//#endregion
//#region node_modules/typebox/build/type/script/token/internal/match.mjs
/** Checks the value is a Tuple-2 [string, string] result */
function IsMatch(value) {
	return IsEqual(value.length, 2);
}
/** Matches on a result and dispatches either left or right arm */
function Match$1(input, ok, fail) {
	return IsMatch(input) ? ok(input[0], input[1]) : fail();
}
//#endregion
//#region node_modules/typebox/build/type/script/token/internal/take.mjs
function TakeVariant(variant, input) {
	return IsEqual(input.indexOf(variant), 0) ? [variant, input.slice(variant.length)] : [];
}
/** Takes one of the given variants or fail */
function Take(variants, input) {
	for (let i = 0; i < variants.length; i++) {
		const result = TakeVariant(variants[i], input);
		if (IsMatch(result)) return result;
	}
	return [];
}
//#endregion
//#region node_modules/typebox/build/type/script/token/internal/char.mjs
function Range(start, end) {
	return Array.from({ length: end - start + 1 }, (_, i) => String.fromCharCode(start + i));
}
const Alpha = [...Range(97, 122), ...Range(65, 90)];
const Digit = ["0", ...Range(49, 57)];
//#endregion
//#region node_modules/typebox/build/type/script/token/internal/trim.mjs
const LineComment = "//";
const OpenComment = "/*";
const CloseComment = "*/";
function DiscardMultilineComment(input) {
	const index = input.indexOf(CloseComment);
	return IsEqual(index, -1) ? "" : input.slice(index + 2);
}
function DiscardLineComment(input) {
	const index = input.indexOf("\n");
	return IsEqual(index, -1) ? "" : input.slice(index);
}
function TrimStartUntilNewline(input) {
	return input.replace(/^[ \t\r\f\v]+/, "");
}
function TrimWhitespace(input) {
	const trimmed = TrimStartUntilNewline(input);
	return trimmed.startsWith(OpenComment) ? TrimWhitespace(DiscardMultilineComment(trimmed.slice(2))) : trimmed.startsWith(LineComment) ? TrimWhitespace(DiscardLineComment(trimmed.slice(2))) : trimmed;
}
function Trim(input) {
	const trimmed = input.trimStart();
	return trimmed.startsWith(OpenComment) ? Trim(DiscardMultilineComment(trimmed.slice(2))) : trimmed.startsWith(LineComment) ? Trim(DiscardLineComment(trimmed.slice(2))) : trimmed;
}
[...Digit];
//#endregion
//#region node_modules/typebox/build/type/script/token/const.mjs
function TakeConst(const_, input) {
	return Take([const_], input);
}
/** Matches if next is the given Const value */
function Const(const_, input) {
	return IsEqual(const_, "") ? ["", input] : const_.startsWith("\n") ? TakeConst(const_, TrimWhitespace(input)) : const_.startsWith(" ") ? TakeConst(const_, input) : TakeConst(const_, Trim(input));
}
[...[
	...Alpha,
	"_",
	"$"
], ...Digit];
[...Digit];
//#endregion
//#region node_modules/typebox/build/type/script/token/until.mjs
function TakeOne(input) {
	return IsEqual(input, "") ? [] : [input.slice(0, 1), input.slice(1)];
}
function IsInputMatchSentinal(end, input) {
	return ShiftLeft(end, (left, right) => input.startsWith(left) ? true : IsInputMatchSentinal(right, input), () => false);
}
/** Match Input until but not including End. No match if End not found. */
function Until(end, input, result = "") {
	return Match$1(TakeOne(input), (One, Rest) => IsInputMatchSentinal(end, input) ? [result, input] : Until(end, Rest, `${result}${One}`), () => []);
}
//#endregion
//#region node_modules/typebox/build/type/script/token/until_1.mjs
/** Match Input until but not including End. No match if End not found or match is zero-length. */
function Until_1(end, input) {
	return Match$1(Until(end, input), (Until, UntilRest) => IsEqual(Until, "") ? [] : [Until, UntilRest], () => []);
}
//#endregion
//#region node_modules/typebox/build/type/script/parser.mjs
const If = (result, left, right = () => []) => result.length === 2 ? left(result) : right();
const PatternBigInt = (input) => If(Const("-?(?:0|[1-9][0-9]*)n", input), ([_0, input]) => [PatternBigIntMapping(_0), input]);
const PatternString = (input) => If(Const(".*", input), ([_0, input]) => [PatternStringMapping(_0), input]);
const PatternNumber = (input) => If(Const("-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?", input), ([_0, input]) => [PatternNumberMapping(_0), input]);
const PatternInteger = (input) => If(Const("-?(?:0|[1-9][0-9]*)", input), ([_0, input]) => [PatternIntegerMapping(_0), input]);
const PatternNever = (input) => If(Const("(?!)", input), ([_0, input]) => [PatternNeverMapping(_0), input]);
const PatternText = (input) => If(Until_1([
	"-?(?:0|[1-9][0-9]*)n",
	".*",
	"-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?",
	"-?(?:0|[1-9][0-9]*)",
	"(?!)",
	"(",
	")",
	"$",
	"|"
], input), ([_0, input]) => [PatternTextMapping(_0), input]);
const PatternBase = (input) => If(If(PatternBigInt(input), ([_0, input]) => [_0, input], () => If(PatternString(input), ([_0, input]) => [_0, input], () => If(PatternNumber(input), ([_0, input]) => [_0, input], () => If(PatternInteger(input), ([_0, input]) => [_0, input], () => If(PatternNever(input), ([_0, input]) => [_0, input], () => If(PatternGroup(input), ([_0, input]) => [_0, input], () => If(PatternText(input), ([_0, input]) => [_0, input], () => []))))))), ([_0, input]) => [PatternBaseMapping(_0), input]);
const PatternGroup = (input) => If(If(Const("(", input), ([_0, input]) => If(PatternBody(input), ([_1, input]) => If(Const(")", input), ([_2, input]) => [[
	_0,
	_1,
	_2
], input]))), ([_0, input]) => [PatternGroupMapping(_0), input]);
const PatternUnion = (input) => If(If(If(PatternTerm(input), ([_0, input]) => If(Const("|", input), ([_1, input]) => If(PatternUnion(input), ([_2, input]) => [[
	_0,
	_1,
	_2
], input]))), ([_0, input]) => [_0, input], () => If(If(PatternTerm(input), ([_0, input]) => [[_0], input]), ([_0, input]) => [_0, input], () => If([[], input], ([_0, input]) => [_0, input], () => []))), ([_0, input]) => [PatternUnionMapping(_0), input]);
const PatternTerm = (input) => If(If(PatternBase(input), ([_0, input]) => If(PatternBody(input), ([_1, input]) => [[_0, _1], input])), ([_0, input]) => [PatternTermMapping(_0), input]);
const PatternBody = (input) => If(If(PatternUnion(input), ([_0, input]) => [_0, input], () => If(PatternTerm(input), ([_0, input]) => [_0, input], () => [])), ([_0, input]) => [PatternBodyMapping(_0), input]);
const Pattern = (input) => If(If(Const("^", input), ([_0, input]) => If(PatternBody(input), ([_1, input]) => If(Const("$", input), ([_2, input]) => [[
	_0,
	_1,
	_2
], input]))), ([_0, input]) => [PatternMapping(_0), input]);
//#endregion
//#region node_modules/typebox/build/type/engine/template_literal/encode.mjs
function JoinString(input) {
	return input.join("|");
}
function UnwrapTemplateLiteralPattern(pattern) {
	return pattern.slice(1, pattern.length - 1);
}
function EncodeLiteral(value, right, pattern) {
	return EncodeTypes(right, `${pattern}${value}`);
}
function EncodeBigInt(right, pattern) {
	return EncodeTypes(right, `${pattern}${BigIntPattern}`);
}
function EncodeInteger(right, pattern) {
	return EncodeTypes(right, `${pattern}${IntegerPattern}`);
}
function EncodeNumber(right, pattern) {
	return EncodeTypes(right, `${pattern}${NumberPattern}`);
}
function EncodeBoolean(right, pattern) {
	return EncodeType(Union([Literal("false"), Literal("true")]), right, pattern);
}
function EncodeString(right, pattern) {
	return EncodeTypes(right, `${pattern}.*`);
}
function EncodeTemplateLiteral(templatePattern, right, pattern) {
	return EncodeTypes(right, `${pattern}${UnwrapTemplateLiteralPattern(templatePattern)}`);
}
function EncodeTemplateLiteralDeferred(types, right, pattern) {
	return EncodeType(TemplateLiteralAction(types, {}), right, pattern);
}
function EncodeEnum(values, right, pattern) {
	return EncodeType(EvaluateEnum(values), right, pattern);
}
function EncodeUnion(types, right, pattern, result = []) {
	return ShiftLeft(types, (head, tail) => EncodeUnion(tail, right, pattern, [...result, EncodeType(head, [], "")]), () => EncodeTypes(right, `${pattern}(${JoinString(result)})`));
}
function EncodeType(type, right, pattern) {
	return IsEnum(type) ? EncodeEnum(type.enum, right, pattern) : IsInteger(type) ? EncodeInteger(right, pattern) : IsLiteral(type) ? EncodeLiteral(type.const, right, pattern) : IsBigInt(type) ? EncodeBigInt(right, pattern) : IsBoolean(type) ? EncodeBoolean(right, pattern) : IsNumber(type) ? EncodeNumber(right, pattern) : IsString(type) ? EncodeString(right, pattern) : IsTemplateLiteral(type) ? EncodeTemplateLiteral(type.pattern, right, pattern) : IsTemplateLiteralDeferred(type) ? EncodeTemplateLiteralDeferred(type.parameters[0], right, pattern) : IsUnion(type) ? EncodeUnion(type.anyOf, right, pattern) : NeverPattern;
}
function EncodeTypes(types, pattern) {
	return ShiftLeft(types, (left, right) => EncodeType(left, right, pattern), () => pattern);
}
function EncodePattern(types) {
	return `^${EncodeTypes(types, "")}$`;
}
/** Encodes a TemplateLiteral type sequence into a TemplateLiteral */
function TemplateLiteralEncode(types) {
	return TemplateLiteralCreate(EncodePattern(types));
}
//#endregion
//#region node_modules/typebox/build/type/engine/template_literal/instantiate.mjs
function TemplateLiteralAction(types, options) {
	return CanInstantiate(types) ? Update(TemplateLiteralEncode(types), {}, options) : TemplateLiteralDeferred(types, options);
}
function TemplateLiteralInstantiate(context, state, types, options) {
	return TemplateLiteralAction(InstantiateTypes(context, state, types), options);
}
//#endregion
//#region node_modules/typebox/build/type/types/template_literal.mjs
/** Creates a deferred TemplateLiteral action. */
function TemplateLiteralDeferred(types, options = {}) {
	return Deferred("TemplateLiteral", [types], options);
}
/** Returns true if this value is a deferred Interface action. */
function IsTemplateLiteralDeferred(value) {
	return IsSchema(value) && HasPropertyKey(value, "action") && IsEqual(value.action, "TemplateLiteral");
}
/** Returns true if the given value is TTemplateLiteral. */
function IsTemplateLiteral(value) {
	return IsKind(value, "TemplateLiteral");
}
//#endregion
//#region node_modules/typebox/build/type/extends/result.mjs
function ExtendsUnion$1(inferred) {
	return Create({ ["~kind"]: "ExtendsUnion" }, { inferred });
}
function IsExtendsUnion(value) {
	return IsObject$1(value) && HasPropertyKey(value, "~kind") && HasPropertyKey(value, "inferred") && IsEqual(value["~kind"], "ExtendsUnion") && IsObject$1(value.inferred);
}
function ExtendsTrue(inferred) {
	return Create({ ["~kind"]: "ExtendsTrue" }, { inferred });
}
function IsExtendsTrue(value) {
	return IsObject$1(value) && HasPropertyKey(value, "~kind") && HasPropertyKey(value, "inferred") && IsEqual(value["~kind"], "ExtendsTrue") && IsObject$1(value.inferred);
}
function ExtendsFalse() {
	return Create({ ["~kind"]: "ExtendsFalse" }, {});
}
function IsExtendsFalse(value) {
	return IsObject$1(value) && HasPropertyKey(value, "~kind") && IsEqual(value["~kind"], "ExtendsFalse");
}
function IsExtendsTrueLike(value) {
	return IsExtendsUnion(value) || IsExtendsTrue(value);
}
function Match(result, true_, false_) {
	return IsExtendsTrueLike(result) ? true_(result.inferred) : false_();
}
//#endregion
//#region node_modules/typebox/build/type/extends/extends_right.mjs
function ExtendsRightInfer(inferred, name, left, right) {
	return Match(ExtendsLeft(inferred, left, right), (checkInferred) => ExtendsTrue(Assign(Assign(inferred, checkInferred), { [name]: left })), () => ExtendsFalse());
}
function ExtendsRightAny(inferred, _left) {
	return ExtendsTrue(inferred);
}
function ExtendsRightDependent(inferred, left, if_, then_, else_) {
	return Match(ExtendsLeft(inferred, left, if_), (inferred) => Match(ExtendsLeft(inferred, left, then_), (inferred) => ExtendsTrue(inferred), () => ExtendsFalse()), () => Match(ExtendsLeft(inferred, left, else_), (inferred) => ExtendsTrue(inferred), () => ExtendsFalse()));
}
function ExtendsRightEnum(inferred, left, right) {
	return ExtendsLeft(inferred, left, EvaluateEnum(right));
}
function ExtendsRightIntersect(inferred, left, right) {
	return ShiftLeft(right, (head, tail) => Match(ExtendsLeft(inferred, left, head), (inferred) => ExtendsRightIntersect(inferred, left, tail), () => ExtendsFalse()), () => ExtendsTrue(inferred));
}
function ExtendsRightTemplateLiteral(inferred, left, right) {
	return ExtendsLeft(inferred, left, EvaluateTemplateLiteral(right));
}
function ExtendsRightUnion(inferred, left, right) {
	return ShiftLeft(right, (head, tail) => Match(ExtendsLeft(inferred, left, head), (inferred) => ExtendsTrue(inferred), () => ExtendsRightUnion(inferred, left, tail)), () => ExtendsFalse());
}
function ExtendsRight(inferred, left, right) {
	return IsAny(right) ? ExtendsRightAny(inferred, left) : IsDependent(right) ? ExtendsRightDependent(inferred, left, right.if, right.then, right.else) : IsEnum(right) ? ExtendsRightEnum(inferred, left, right.enum) : IsInfer(right) ? ExtendsRightInfer(inferred, right.name, left, right.extends) : IsIntersect(right) ? ExtendsRightIntersect(inferred, left, right.allOf) : IsTemplateLiteral(right) ? ExtendsRightTemplateLiteral(inferred, left, right.pattern) : IsUnion(right) ? ExtendsRightUnion(inferred, left, right.anyOf) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}
//#endregion
//#region node_modules/typebox/build/type/extends/any.mjs
function ExtendsAny(inferred, left, right) {
	return IsInfer(right) ? ExtendsRight(inferred, left, right) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsUnion$1(inferred);
}
//#endregion
//#region node_modules/typebox/build/type/extends/array.mjs
function ExtendsImmutable(left, right) {
	const isImmutableLeft = IsImmutable(left);
	const isImmutableRight = IsImmutable(right);
	return isImmutableLeft && isImmutableRight ? true : !isImmutableLeft && isImmutableRight ? true : isImmutableLeft && !isImmutableRight ? false : true;
}
function ExtendsArray(inferred, arrayLeft, left, right) {
	return IsArray(right) ? ExtendsImmutable(arrayLeft, right) ? ExtendsLeft(inferred, left, right.items) : ExtendsFalse() : ExtendsRight(inferred, arrayLeft, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/bigint.mjs
function ExtendsBigInt(inferred, left, right) {
	return IsBigInt(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/boolean.mjs
function ExtendsBoolean(inferred, left, right) {
	return IsBoolean(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/parameters.mjs
function ParameterCompare(inferred, left, leftRest, right, rightRest) {
	const checkLeft = IsInfer(right) ? left : right;
	const checkRight = IsInfer(right) ? right : left;
	const isLeftOptional = IsOptional(left);
	const isRightOptional = IsOptional(right);
	return !isLeftOptional && isRightOptional ? ExtendsFalse() : Match(ExtendsLeft(inferred, checkLeft, checkRight), (inferred) => ExtendsParameters(inferred, leftRest, rightRest), () => ExtendsFalse());
}
function ParameterRight(inferred, left, leftRest, rightRest) {
	return ShiftLeft(rightRest, (head, tail) => ParameterCompare(inferred, left, leftRest, head, tail), () => IsOptional(left) ? ExtendsTrue(inferred) : ExtendsFalse());
}
function ParametersLeft(inferred, left, rightRest) {
	return ShiftLeft(left, (head, tail) => ParameterRight(inferred, head, tail, rightRest), () => ExtendsTrue(inferred));
}
function ExtendsParameters(inferred, left, right) {
	return ParametersLeft(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/return_type.mjs
function ExtendsReturnType(inferred, left, right) {
	return IsVoid(right) ? ExtendsTrue(inferred) : ExtendsLeft(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/constructor.mjs
function ExtendsConstructor(inferred, parameters, returnType, right) {
	return IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : IsConstructor(right) ? Match(ExtendsParameters(inferred, parameters, right["parameters"]), (inferred) => ExtendsReturnType(inferred, returnType, right["instanceType"]), () => ExtendsFalse()) : ExtendsFalse();
}
//#endregion
//#region node_modules/typebox/build/type/extends/dependent.mjs
function ExtendsDependent(inferred, if_, then_, else_, right) {
	return Match(ExtendsLeft(inferred, if_, right), () => ExtendsLeft(inferred, then_, right), () => ExtendsLeft(inferred, else_, right));
}
//#endregion
//#region node_modules/typebox/build/type/extends/enum.mjs
function ExtendsEnum(inferred, left, right) {
	return ExtendsLeft(inferred, EvaluateEnum(left), right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/function.mjs
function ExtendsFunction(inferred, parameters, returnType, right) {
	return IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : IsFunction(right) ? Match(ExtendsParameters(inferred, parameters, right["parameters"]), (inferred) => ExtendsReturnType(inferred, returnType, right["returnType"]), () => ExtendsFalse()) : ExtendsFalse();
}
//#endregion
//#region node_modules/typebox/build/type/extends/integer.mjs
function ExtendsInteger(inferred, left, right) {
	return IsInteger(right) ? ExtendsTrue(inferred) : IsNumber(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/intersect.mjs
function ExtendsIntersect(inferred, left, right) {
	return ExtendsLeft(inferred, EvaluateIntersect(left), right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/literal.mjs
function ExtendsLiteralValue(inferred, left, right) {
	return left === right ? ExtendsTrue(inferred) : ExtendsFalse();
}
function ExtendsLiteralBigInt(inferred, left, right) {
	return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsBigInt(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralBoolean(inferred, left, right) {
	return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsBoolean(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralNumber(inferred, left, right) {
	return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsNumber(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralString(inferred, left, right) {
	return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsString(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteral(inferred, left, right) {
	return IsBigInt$1(left.const) ? ExtendsLiteralBigInt(inferred, left.const, right) : IsBoolean$1(left.const) ? ExtendsLiteralBoolean(inferred, left.const, right) : IsNumber$1(left.const) ? ExtendsLiteralNumber(inferred, left.const, right) : IsString$1(left.const) ? ExtendsLiteralString(inferred, left.const, right) : Unreachable();
}
//#endregion
//#region node_modules/typebox/build/type/extends/never.mjs
function ExtendsNever(inferred, left, right) {
	return IsInfer(right) ? ExtendsRight(inferred, left, right) : ExtendsTrue(inferred);
}
//#endregion
//#region node_modules/typebox/build/type/extends/null.mjs
function ExtendsNull(inferred, left, right) {
	return IsNull(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/number.mjs
function ExtendsNumber(inferred, left, right) {
	return IsNumber(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/object.mjs
function ExtendsPropertyOptional(inferred, left, right) {
	return IsOptional(left) ? IsOptional(right) ? ExtendsTrue(inferred) : ExtendsFalse() : ExtendsTrue(inferred);
}
function ExtendsProperty(inferred, left, right) {
	return IsInfer(right) && IsNever(right.extends) ? ExtendsFalse() : Match(ExtendsLeft(inferred, left, right), (inferred) => ExtendsPropertyOptional(inferred, left, right), () => ExtendsFalse());
}
function ExtractInferredProperties(keys, properties) {
	return keys.reduce((result, key) => {
		return key in properties ? IsExtendsTrueLike(properties[key]) ? {
			...result,
			...properties[key].inferred
		} : Unreachable() : Unreachable();
	}, {});
}
function ExtendsPropertiesComparer(inferred, left, right) {
	const properties = {};
	for (const rightKey of Keys(right)) properties[rightKey] = rightKey in left ? ExtendsProperty({}, left[rightKey], right[rightKey]) : IsOptional(right[rightKey]) ? IsInfer(right[rightKey]) ? ExtendsTrue(Assign(inferred, { [right[rightKey].name]: right[rightKey].extends })) : ExtendsTrue(inferred) : ExtendsFalse();
	const checked = Values(properties).every((result) => IsExtendsTrueLike(result));
	const extracted = checked ? ExtractInferredProperties(Keys(properties), properties) : {};
	return checked ? ExtendsTrue(extracted) : ExtendsFalse();
}
function ExtendsProperties(inferred, left, right) {
	const compared = ExtendsPropertiesComparer(inferred, left, right);
	return IsExtendsTrueLike(compared) ? ExtendsTrue(Assign(inferred, compared.inferred)) : ExtendsFalse();
}
function ExtendsObjectToObject(inferred, left, right) {
	return ExtendsProperties(inferred, left, right);
}
function RecordMergeInferred(left, right) {
	return Keys(right).reduce((result, key) => {
		return {
			...result,
			[key]: HasPropertyKey(left, key) ? IsUnion(result[key]) ? Union([...result[key].anyOf, right[key]]) : Union([left[key], right[key]]) : right[key]
		};
	}, left);
}
function ExtendsRecordComparer(properties, keys, type, result) {
	return ShiftLeft(keys, (left, right) => Match(ExtendsLeft({}, properties[left], type), (inferred) => ExtendsRecordComparer(properties, right, type, RecordMergeInferred(result, inferred)), () => ExtendsFalse()), () => ExtendsTrue(result));
}
function ExtendsObjectToRecord(inferred, properties, _pattern, value) {
	return ExtendsRecordComparer(properties, Keys(properties), value, inferred);
}
function ExtendsObject(inferred, left, right) {
	return IsRecord(right) ? ExtendsObjectToRecord(inferred, left, RecordPattern(right), RecordValue(right)) : IsObject(right) ? ExtendsObjectToObject(inferred, left, right.properties) : ExtendsRight(inferred, _Object_(left), right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/record.mjs
function FromObject$6(inferred, properties) {
	return IsEqual(Keys(properties).length, 0) ? ExtendsTrue(inferred) : ExtendsFalse();
}
function FromRecord$1(inferred, _leftKey, leftValue, _rightKey, rightValue) {
	return ExtendsLeft(inferred, leftValue, rightValue);
}
function ExtendsRecord(inferred, leftPattern, leftValue, right) {
	return IsRecord(right) ? FromRecord$1(inferred, RecordPatternToType(leftPattern), leftValue, RecordPatternToType(RecordPattern(right)), RecordValue(right)) : IsObject(right) ? FromObject$6(inferred, right.properties) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}
//#endregion
//#region node_modules/typebox/build/type/extends/string.mjs
function ExtendsString(inferred, left, right) {
	return IsString(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/symbol.mjs
function ExtendsSymbol(inferred, left, right) {
	return IsSymbol(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/template_literal.mjs
function ExtendsTemplateLiteral(inferred, left, right) {
	return ExtendsLeft(inferred, EvaluateTemplateLiteral(left), right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/inference.mjs
function Inferrable(name, type) {
	return Create({ "~kind": "Inferrable" }, {
		name,
		type
	}, {});
}
function IsInferable(value) {
	return IsObject$1(value) && HasPropertyKey(value, "~kind") && HasPropertyKey(value, "name") && HasPropertyKey(value, "type") && IsEqual(value["~kind"], "Inferrable") && IsString$1(value.name) && IsObject$1(value.type);
}
function TryRestInferable(type) {
	return IsRest(type) ? IsInfer(type.items) ? IsArray(type.items.extends) ? Inferrable(type.items.name, type.items.extends.items) : IsUnknown(type.items.extends) ? Inferrable(type.items.name, type.items.extends) : void 0 : Unreachable() : void 0;
}
function TryInferable(type) {
	return IsInfer(type) ? Inferrable(type.name, type.extends) : void 0;
}
function TryInferResults(rest, right) {
	const result = [];
	for (const head of rest) {
		if (!IsExtendsTrueLike(ExtendsLeft({}, head, right))) return void 0;
		result.push(head);
	}
	return result;
}
function InferTupleResult(inferred, name, left, right) {
	const results = TryInferResults(left, right);
	return IsArray$1(results) ? ExtendsTrue(Assign(inferred, { [name]: Tuple(results) })) : ExtendsFalse();
}
function InferUnionResult(inferred, name, left, right) {
	const results = TryInferResults(left, right);
	return IsArray$1(results) ? ExtendsTrue(Assign(inferred, { [name]: Union(results) })) : ExtendsFalse();
}
//#endregion
//#region node_modules/typebox/build/type/extends/tuple.mjs
function Reverse(types) {
	return [...types].reverse();
}
function ApplyReverse(types, reversed) {
	return reversed ? Reverse(types) : types;
}
function Reversed(types) {
	const first = types.length > 0 ? types[0] : void 0;
	return IsSchema(IsSchema(first) ? TryRestInferable(first) : void 0);
}
function ElementsCompare(inferred, reversed, left, leftRest, right, rightRest) {
	return Match(ExtendsLeft(inferred, left, right), (checkInferred) => Elements(checkInferred, reversed, leftRest, rightRest), () => ExtendsFalse());
}
function ElementsLeft(inferred, reversed, leftRest, right, rightRest) {
	const inferable = TryRestInferable(right);
	return IsInferable(inferable) ? InferTupleResult(inferred, inferable["name"], ApplyReverse(leftRest, reversed), inferable["type"]) : ShiftLeft(leftRest, (head, tail) => ElementsCompare(inferred, reversed, head, tail, right, rightRest), () => ExtendsFalse());
}
function ElementsRight(inferred, reversed, leftRest, rightRest) {
	return ShiftLeft(rightRest, (head, tail) => ElementsLeft(inferred, reversed, leftRest, head, tail), () => IsEqual(leftRest.length, 0) ? ExtendsTrue(inferred) : ExtendsFalse());
}
function Elements(inferred, reversed, leftRest, rightRest) {
	return ElementsRight(inferred, reversed, leftRest, rightRest);
}
function ExtendsTupleToTuple(inferred, left, right) {
	const instantiatedRight = InstantiateElements(inferred, State([], []), right);
	const reversed = Reversed(instantiatedRight);
	return Elements(inferred, reversed, ApplyReverse(left, reversed), ApplyReverse(instantiatedRight, reversed));
}
function ExtendsTupleToArrayReduce(inferred, left, right) {
	for (const head of left) {
		const result = ExtendsLeft(inferred, head, right);
		if (!IsExtendsTrueLike(result)) return result;
		inferred = result.inferred;
	}
	return ExtendsTrue(inferred);
}
function ExtendsTupleToArray(inferred, left, right) {
	const inferrable = TryInferable(right);
	return IsInferable(inferrable) ? InferUnionResult(inferred, inferrable["name"], left, inferrable["type"]) : ExtendsTupleToArrayReduce(inferred, left, right);
}
function ExtendsTuple(inferred, left, right) {
	const instantiatedLeft = InstantiateElements(inferred, State([], []), left);
	return IsTuple(right) ? ExtendsTupleToTuple(inferred, instantiatedLeft, right.items) : IsArray(right) ? ExtendsTupleToArray(inferred, instantiatedLeft, right.items) : ExtendsRight(inferred, Tuple(instantiatedLeft), right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/undefined.mjs
function ExtendsUndefined(inferred, left, right) {
	return IsVoid(right) ? ExtendsTrue(inferred) : IsUndefined(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/union.mjs
function ExtendsUnionSome(inferred, type, unionTypes) {
	return ShiftLeft(unionTypes, (head, tail) => Match(ExtendsLeft(inferred, type, head), (inferred) => ExtendsTrue(inferred), () => ExtendsUnionSome(inferred, type, tail)), () => ExtendsFalse());
}
function ExtendsUnionLeft(inferred, left, right) {
	return ShiftLeft(left, (head, tail) => Match(ExtendsUnionSome(inferred, head, right), (inferred) => ExtendsUnionLeft(inferred, tail, right), () => ExtendsFalse()), () => ExtendsTrue(inferred));
}
function ExtendsUnion(inferred, left, right) {
	const inferrable = TryInferable(right);
	return IsInferable(inferrable) ? InferUnionResult(inferred, inferrable.name, left, inferrable.type) : IsUnion(right) ? ExtendsUnionLeft(inferred, left, right.anyOf) : ExtendsUnionLeft(inferred, left, [right]);
}
//#endregion
//#region node_modules/typebox/build/type/extends/unknown.mjs
function ExtendsUnknown(inferred, left, right) {
	return IsInfer(right) ? ExtendsRight(inferred, left, right) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}
//#endregion
//#region node_modules/typebox/build/type/extends/void.mjs
function ExtendsVoid(inferred, left, right) {
	return IsVoid(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}
//#endregion
//#region node_modules/typebox/build/type/extends/extends_left.mjs
function ExtendsLeft(inferred, left, right) {
	return IsAny(left) ? ExtendsAny(inferred, left, right) : IsArray(left) ? ExtendsArray(inferred, left, left.items, right) : IsBigInt(left) ? ExtendsBigInt(inferred, left, right) : IsBoolean(left) ? ExtendsBoolean(inferred, left, right) : IsConstructor(left) ? ExtendsConstructor(inferred, left.parameters, left.instanceType, right) : IsDependent(left) ? ExtendsDependent(inferred, left.if, left.then, left.else, right) : IsEnum(left) ? ExtendsEnum(inferred, left.enum, right) : IsFunction(left) ? ExtendsFunction(inferred, left.parameters, left.returnType, right) : IsInteger(left) ? ExtendsInteger(inferred, left, right) : IsIntersect(left) ? ExtendsIntersect(inferred, left.allOf, right) : IsLiteral(left) ? ExtendsLiteral(inferred, left, right) : IsNever(left) ? ExtendsNever(inferred, left, right) : IsNull(left) ? ExtendsNull(inferred, left, right) : IsNumber(left) ? ExtendsNumber(inferred, left, right) : IsObject(left) ? ExtendsObject(inferred, left.properties, right) : IsRecord(left) ? ExtendsRecord(inferred, RecordPattern(left), RecordValue(left), right) : IsString(left) ? ExtendsString(inferred, left, right) : IsSymbol(left) ? ExtendsSymbol(inferred, left, right) : IsTemplateLiteral(left) ? ExtendsTemplateLiteral(inferred, left.pattern, right) : IsTuple(left) ? ExtendsTuple(inferred, left.items, right) : IsUndefined(left) ? ExtendsUndefined(inferred, left, right) : IsUnion(left) ? ExtendsUnion(inferred, left.anyOf, right) : IsUnknown(left) ? ExtendsUnknown(inferred, left, right) : IsVoid(left) ? ExtendsVoid(inferred, left, right) : ExtendsFalse();
}
//#endregion
//#region node_modules/typebox/build/type/engine/interface/instantiate.mjs
function InterfaceOperation(heritage, properties) {
	return EvaluateIntersect([...heritage, _Object_(properties)]);
}
function InterfaceAction(heritage, properties, options) {
	return CanInstantiate(heritage) ? Update(InterfaceOperation(heritage, properties), {}, options) : InterfaceDeferred(heritage, properties, options);
}
function InterfaceInstantiate(context, state, heritage, properties, options) {
	return InterfaceAction(InstantiateTypes(context, state, heritage), InstantiateProperties(context, state, properties), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/interface.mjs
/** Creates a deferred Interface action. */
function InterfaceDeferred(heritage, properties, options = {}) {
	return Deferred("Interface", [heritage, properties], options);
}
/** Returns true if this value is a deferred Interface action. */
function IsInterfaceDeferred(value) {
	return IsSchema(value) && HasPropertyKey(value, "action") && IsEqual(value.action, "Interface");
}
//#endregion
//#region node_modules/typebox/build/type/engine/cyclic/check.mjs
function FromRef$3(stack, context, ref) {
	return stack.includes(ref) ? true : FromType$15([...stack, ref], context, context[ref]);
}
function FromProperties$2(stack, context, properties) {
	return FromTypes$3(stack, context, PropertyValues(properties));
}
function FromTypes$3(stack, context, types) {
	return ShiftLeft(types, (left, right) => FromType$15(stack, context, left) ? true : FromTypes$3(stack, context, right), () => false);
}
function FromType$15(stack, context, type) {
	return IsRef(type) ? FromRef$3(stack, context, type.$ref) : IsArray(type) ? FromType$15(stack, context, type.items) : IsConstructor(type) ? FromTypes$3(stack, context, [...type.parameters, type.instanceType]) : IsFunction(type) ? FromTypes$3(stack, context, [...type.parameters, type.returnType]) : IsInterfaceDeferred(type) ? FromProperties$2(stack, context, type.parameters[1]) : IsIntersect(type) ? FromTypes$3(stack, context, type.allOf) : IsObject(type) ? FromProperties$2(stack, context, type.properties) : IsUnion(type) ? FromTypes$3(stack, context, type.anyOf) : IsTuple(type) ? FromTypes$3(stack, context, type.items) : IsRecord(type) ? FromType$15(stack, context, RecordValue(type)) : false;
}
/** Performs a cyclic check on the given type. Initial key stack can be empty, but faster if specified */
function CyclicCheck(stack, context, type) {
	return FromType$15(stack, context, type);
}
//#endregion
//#region node_modules/typebox/build/type/engine/cyclic/candidates.mjs
function ResolveCandidateKeys(context, keys) {
	return keys.reduce((result, left) => {
		return CyclicCheck([left], context, context[left]) ? [...result, left] : result;
	}, []);
}
/** Returns keys for context types that need to be transformed to TCyclic. */
function CyclicCandidates(context) {
	return ResolveCandidateKeys(context, PropertyKeys(context));
}
//#endregion
//#region node_modules/typebox/build/type/engine/cyclic/dependencies.mjs
function FromRef$2(context, ref, result) {
	return result.includes(ref) ? result : ref in context ? FromType$14(context, context[ref], [...result, ref]) : Unreachable();
}
function FromProperties$1(context, properties, result) {
	return FromTypes$2(context, PropertyValues(properties), result);
}
function FromTypes$2(context, types, result) {
	return types.reduce((result, left) => {
		return FromType$14(context, left, result);
	}, result);
}
function FromType$14(context, type, result) {
	return IsRef(type) ? FromRef$2(context, type.$ref, result) : IsArray(type) ? FromType$14(context, type.items, result) : IsConstructor(type) ? FromTypes$2(context, [...type.parameters, type.instanceType], result) : IsFunction(type) ? FromTypes$2(context, [...type.parameters, type.returnType], result) : IsInterfaceDeferred(type) ? FromProperties$1(context, type.parameters[1], result) : IsIntersect(type) ? FromTypes$2(context, type.allOf, result) : IsObject(type) ? FromProperties$1(context, type.properties, result) : IsUnion(type) ? FromTypes$2(context, type.anyOf, result) : IsTuple(type) ? FromTypes$2(context, type.items, result) : IsRecord(type) ? FromType$14(context, RecordValue(type), result) : result;
}
/** Returns dependent cyclic keys for the given type. This function is used to dead-type-eliminate (DTE) for initializing TCyclic types. */
function CyclicDependencies(context, key, type) {
	return FromType$14(context, type, [key]);
}
//#endregion
//#region node_modules/typebox/build/type/engine/cyclic/extends.mjs
function FromRef$1(_ref) {
	return Any();
}
function FromProperties(properties) {
	return Keys(properties).reduce((result, key) => {
		return {
			...result,
			[key]: FromType$13(properties[key])
		};
	}, {});
}
function FromTypes$1(types) {
	return types.reduce((result, left) => {
		return [...result, FromType$13(left)];
	}, []);
}
function FromType$13(type) {
	return IsRef(type) ? FromRef$1(type.$ref) : IsArray(type) ? _Array_(FromType$13(type.items), ArrayOptions(type)) : IsConstructor(type) ? Constructor(FromTypes$1(type.parameters), FromType$13(type.instanceType)) : IsFunction(type) ? _Function_(FromTypes$1(type.parameters), FromType$13(type.returnType)) : IsIntersect(type) ? Intersect(FromTypes$1(type.allOf)) : IsObject(type) ? _Object_(FromProperties(type.properties)) : IsRecord(type) ? Record(RecordKey(type), FromType$13(RecordValue(type))) : IsUnion(type) ? Union(FromTypes$1(type.anyOf)) : IsTuple(type) ? Tuple(FromTypes$1(type.items)) : type;
}
function CyclicAnyFromParameters(defs, ref) {
	return ref in defs ? FromType$13(defs[ref]) : Unknown();
}
/** Transforms TCyclic TRef's into TAny's. This function is used prior to TExtends checks to enable cyclics to be structurally checked and terminated (with TAny) at first point of recursion, what would otherwise be a recursive TRef.*/
function CyclicExtends(type) {
	return CyclicAnyFromParameters(type.$defs, type.$ref);
}
//#endregion
//#region node_modules/typebox/build/type/engine/cyclic/instantiate.mjs
function CyclicInterface(context, heritage, properties) {
	const instantiatedHeritage = InstantiateTypes(context, State([], []), heritage);
	const instantiatedProperties = InstantiateProperties({}, State([], []), properties);
	return EvaluateIntersect([...instantiatedHeritage, _Object_(instantiatedProperties)]);
}
function CyclicDefinitions(context, dependencies) {
	return Keys(context).filter((key) => dependencies.includes(key)).reduce((result, key) => {
		const type = context[key];
		const instantiatedType = IsInterfaceDeferred(type) ? CyclicInterface(context, type.parameters[0], type.parameters[1]) : type;
		return {
			...result,
			[key]: instantiatedType
		};
	}, {});
}
function InstantiateCyclic(context, ref, type) {
	return Cyclic(CyclicDefinitions(context, CyclicDependencies(context, ref, type)), ref);
}
//#endregion
//#region node_modules/typebox/build/type/engine/cyclic/target.mjs
function Resolve(defs, ref) {
	return ref in defs ? IsRef(defs[ref]) ? Resolve(defs, defs[ref].$ref) : defs[ref] : Never();
}
/** Returns the target Type from the Defs or Never if target is non-resolvable */
function CyclicTarget(defs, ref) {
	return Resolve(defs, ref);
}
//#endregion
//#region node_modules/typebox/build/type/extends/extends.mjs
function Canonical(type) {
	return IsCyclic(type) ? CyclicExtends(type) : IsUnsafe(type) ? Unknown() : type;
}
/** Performs a structural extends check on left and right types and yields inferred types on right if specified. */
function Extends(inferred, left, right) {
	return ExtendsLeft(inferred, Canonical(left), Canonical(right));
}
/** Compares left and right types and determines their set relationship. */
function Compare(left, right) {
	const extendsCheck = [Extends({}, left, right), Extends({}, right, left)];
	return IsExtendsTrueLike(extendsCheck[0]) && IsExtendsTrueLike(extendsCheck[1]) ? 0 : IsExtendsTrueLike(extendsCheck[0]) && IsExtendsFalse(extendsCheck[1]) ? 2 : IsExtendsFalse(extendsCheck[0]) && IsExtendsTrueLike(extendsCheck[1]) ? 3 : 1;
}
//#endregion
//#region node_modules/typebox/build/type/engine/evaluate/broaden.mjs
function BroadenFilter(type, types, result = [], all = types) {
	return ShiftLeft(types, (left, right) => {
		const compare = Compare(type, left);
		return IsEqual(compare, 2) || IsEqual(compare, 0) ? all : IsEqual(compare, 1) ? BroadenFilter(type, right, [...result, left], all) : BroadenFilter(type, right, result, all);
	}, () => [...result, type]);
}
function BroadenType(type, types, result) {
	const evaluated = EvaluateType(type);
	return IsAny(evaluated) ? [evaluated] : IsUnknown(evaluated) ? [evaluated] : IsNever(evaluated) ? BroadenTypes(types, result) : IsObject(evaluated) ? BroadenTypes(types, [...result, evaluated]) : BroadenTypes(types, BroadenFilter(evaluated, result));
}
function BroadenTypes(types, result = []) {
	return ShiftLeft(types, (left, right) => BroadenType(left, right, result), () => result);
}
/** Broadens a set of types and returns either the most broad type, or union or disjoint types. */
function Broaden(types) {
	return Flatten(BroadenTypes(types));
}
//#endregion
//#region node_modules/typebox/build/type/engine/evaluate/instantiate.mjs
function EvaluateAction(type, options) {
	return Update(EvaluateType(type), {}, options);
}
function EvaluateInstantiate(context, state, type, options) {
	return EvaluateAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/call/distribute_arguments.mjs
function CollectDistributionNames(expression, result = []) {
	return IsDeferred(expression) && IsEqual(expression.action, "Conditional") ? IsRef(expression.parameters[0]) ? CollectDistributionNames(expression.parameters[2], CollectDistributionNames(expression.parameters[3], [...result, expression.parameters[0]["$ref"]])) : CollectDistributionNames(expression.parameters[2], CollectDistributionNames(expression.parameters[3], result)) : IsDeferred(expression) && IsEqual(expression.action, "Mapped") ? IsDeferred(expression.parameters[1]) && IsEqual(expression.parameters[1].action, "KeyOf") && IsRef(expression.parameters[1].parameters[0]) ? [...result, expression.parameters[1].parameters[0]["$ref"]] : result : result;
}
function BuildDistributionArray(parameters, names) {
	return parameters.reduce((result, left) => [...result, names.includes(left.name)], []);
}
function ZipDistributionArray(arguments_, distributionArray, result = []) {
	return ShiftLeft(arguments_, (argumentLeft, argumentRight) => ShiftLeft(distributionArray, (booleanLeft, booleanRight) => ZipDistributionArray(argumentRight, booleanRight, [...result, [booleanLeft, argumentLeft]]), () => result), () => result);
}
function CanonicalArgument(type) {
	return IsTemplateLiteral(type) ? EvaluateTemplateLiteral(type.pattern) : IsEnum(type) ? EvaluateEnum(type.enum) : type;
}
function Expand(type) {
	const canonicalArgument = CanonicalArgument(type);
	return IsUnion(canonicalArgument) ? [...canonicalArgument.anyOf] : [canonicalArgument];
}
function Append(current, type) {
	return current.reduce((result, left) => [...result, [...left, type]], []);
}
function Cross(current, variants) {
	return variants.reduce((result, left) => {
		return [...result, ...Append(current, left)];
	}, []);
}
function Distribute(zipped) {
	return zipped.reduce((result, left) => {
		return IsEqual(left[0], true) ? Cross(result, Expand(left[1])) : Cross(result, [left[1]]);
	}, [[]]);
}
function DistributeArguments(parameters, arguments_, expression) {
	const zippedArguments = ZipDistributionArray(arguments_, BuildDistributionArray(parameters, CollectDistributionNames(expression)));
	return IsDeferred(expression) && IsEqual(expression.action, "Conditional") ? Distribute(zippedArguments) : IsDeferred(expression) && IsEqual(expression.action, "Mapped") ? Distribute(zippedArguments) : [arguments_];
}
//#endregion
//#region node_modules/typebox/build/type/engine/call/resolve_target.mjs
function FromNotResolvable() {
	return ["(not-resolvable)", Never()];
}
function FromNotGeneric() {
	return ["(not-generic)", Never()];
}
function FromGeneric(name, parameters, expression) {
	return [name, Generic(parameters, expression)];
}
function FromRef(context, ref, arguments_) {
	return ref in context ? FromType$12(context, ref, context[ref], arguments_) : FromNotResolvable();
}
function FromType$12(context, name, target, arguments_) {
	return IsGeneric(target) ? FromGeneric(name, target.parameters, target.expression) : IsRef(target) ? FromRef(context, target.$ref, arguments_) : FromNotGeneric();
}
/** Resolves a named generic target from the context, or returns TNever if it cannot be resolved or is not generic. */
function ResolveTarget(context, target, arguments_) {
	return FromType$12(context, "(anonymous)", target, arguments_);
}
//#endregion
//#region node_modules/typebox/build/type/engine/call/resolve_arguments.mjs
function AssertArgumentExtends(name, type, extends_) {
	if (IsInfer(type) || IsCall(type) || IsExtendsTrueLike(Extends({}, type, extends_))) return;
	const cause = {
		parameter: name,
		expect: extends_,
		actual: type
	};
	throw new Error(`Argument for parameter ${name} does not satisfy constraint`, { cause });
}
function BindArgument(context, state, name, extends_, type) {
	const instantiatedArgument = InstantiateType(context, state, type);
	AssertArgumentExtends(name, instantiatedArgument, extends_);
	return Assign(context, { [name]: instantiatedArgument });
}
function BindArguments(context, state, parameterLeft, parameterRight, arguments_) {
	const instantiatedExtends = InstantiateType(context, state, parameterLeft.extends);
	const instantiatedEquals = InstantiateType(context, state, parameterLeft.equals);
	return ShiftLeft(arguments_, (left, right) => BindParameters(BindArgument(context, state, parameterLeft["name"], instantiatedExtends, left), state, parameterRight, right), () => BindParameters(BindArgument(context, state, parameterLeft["name"], instantiatedExtends, instantiatedEquals), state, parameterRight, []));
}
function BindParameters(context, state, parameters, arguments_) {
	return ShiftLeft(parameters, (left, right) => BindArguments(context, state, left, right, arguments_), () => context);
}
function ResolveArgumentsContext(context, state, parameters, arguments_) {
	return BindParameters(context, state, parameters, arguments_);
}
//#endregion
//#region node_modules/typebox/build/type/engine/call/instantiate.mjs
let instantiationDepth = 0;
let instantiationCount = 0;
function InstantiationAssert() {
	if (IsLessThan(instantiationCount, Get().maxInstantiationCount)) return;
	throw Error("Type instantiation is excessively deep and possibly infinite");
}
function InstantiationIncrement() {
	InstantiationAssert();
	instantiationCount++;
	instantiationDepth++;
}
function InstantiationDecrement() {
	instantiationDepth--;
	if (IsEqual(instantiationDepth, 0)) instantiationCount = 0;
}
function Peek(state) {
	return IsGreaterThan(state.callstack.length, 0) ? state.callstack[state.callstack.length - 1] : "";
}
function IsTailCall(state, name) {
	return IsEqual(Peek(state), name);
}
function CallDispatch(context, state, target, parameters, expression, arguments_) {
	InstantiationIncrement();
	try {
		const argumentsContext = ResolveArgumentsContext(context, state, parameters, arguments_);
		const returnType = InstantiateType(argumentsContext, State([...state["callstack"], target["$ref"]], state["visited"]), expression);
		return InstantiateType(argumentsContext, State([], []), returnType);
	} finally {
		InstantiationDecrement();
	}
}
function CallDistributed(context, state, target, parameters, expression, distributedArguments) {
	return distributedArguments.reduce((result, arguments_) => {
		const returnType = CallDispatch(context, state, target, parameters, expression, arguments_);
		return [...result, returnType];
	}, []);
}
function CallImmediate(context, state, target, parameters, expression, arguments_) {
	const returnTypes = CallDistributed(context, state, target, parameters, expression, DistributeArguments(parameters, arguments_, expression));
	return IsEqual(returnTypes.length, 1) ? returnTypes[0] : EvaluateUnion(returnTypes);
}
function CallInstantiate(context, state, target, arguments_) {
	const instantiatedArguments = InstantiateTypes(context, state, arguments_);
	const resolved = ResolveTarget(context, target, arguments_);
	const name = resolved[0];
	const type = resolved[1];
	return IsGeneric(type) ? IsTailCall(state, name) ? CallConstruct(Ref(name), instantiatedArguments) : CallImmediate(context, state, Ref(name), type.parameters, type.expression, instantiatedArguments) : CallConstruct(target, instantiatedArguments);
}
//#endregion
//#region node_modules/typebox/build/type/types/call.mjs
function CallConstruct(target, arguments_) {
	return Create({ ["~kind"]: "Call" }, {
		type: "call",
		target,
		arguments: arguments_
	}, {});
}
/** Returns true if the given type is a TCall. */
function IsCall(value) {
	return IsKind(value, "Call");
}
//#endregion
//#region node_modules/typebox/build/type/engine/immutable/instantiate_remove.mjs
function RemoveImmutableOperation(type) {
	return Discard(type, ["~immutable"]);
}
function RemoveImmutableAction(type, options) {
	return Update(RemoveImmutableOperation(type), {}, options);
}
function RemoveImmutableInstantiate(context, state, type, options) {
	return RemoveImmutableAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/intrinsics/mapping.mjs
function ApplyMapping(mapping, value) {
	return mapping(value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/intrinsics/from_literal.mjs
function FromLiteral$2(mapping, value) {
	return IsString$1(value) ? Literal(ApplyMapping(mapping, value)) : Literal(value);
}
//#endregion
//#region node_modules/typebox/build/type/engine/intrinsics/from_template_literal.mjs
function FromTemplateLiteral$2(mapping, pattern) {
	return FromType$11(mapping, EvaluateTemplateLiteral(pattern));
}
//#endregion
//#region node_modules/typebox/build/type/engine/intrinsics/from_union.mjs
function FromUnion$6(mapping, types) {
	return Union(types.map((type) => FromType$11(mapping, type)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/intrinsics/from_type.mjs
function FromType$11(mapping, type) {
	return IsLiteral(type) ? FromLiteral$2(mapping, type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral$2(mapping, type.pattern) : IsUnion(type) ? FromUnion$6(mapping, type.anyOf) : type;
}
//#endregion
//#region node_modules/typebox/build/type/action/capitalize.mjs
/** Creates a deferred Capitalize action. */
function CapitalizeDeferred(type, options = {}) {
	return Deferred("Capitalize", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/action/lowercase.mjs
/** Creates a deferred Lowercase action. */
function LowercaseDeferred(type, options = {}) {
	return Deferred("Lowercase", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/action/uncapitalize.mjs
/** Creates a deferred Uncapitalize action. */
function UncapitalizeDeferred(type, options = {}) {
	return Deferred("Uncapitalize", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/action/uppercase.mjs
/** Creates a deferred Uppercase action. */
function UppercaseDeferred(type, options = {}) {
	return Deferred("Uppercase", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/intrinsics/instantiate.mjs
const CapitalizeMapping = (input) => input[0].toUpperCase() + input.slice(1);
const LowercaseMapping = (input) => input.toLowerCase();
const UncapitalizeMapping = (input) => input[0].toLowerCase() + input.slice(1);
const UppercaseMapping = (input) => input.toUpperCase();
function CapitalizeAction(type, options) {
	return CanInstantiate([type]) ? Update(FromType$11(CapitalizeMapping, type), {}, options) : CapitalizeDeferred(type, options);
}
function LowercaseAction(type, options) {
	return CanInstantiate([type]) ? Update(FromType$11(LowercaseMapping, type), {}, options) : LowercaseDeferred(type, options);
}
function UncapitalizeAction(type, options) {
	return CanInstantiate([type]) ? Update(FromType$11(UncapitalizeMapping, type), {}, options) : UncapitalizeDeferred(type, options);
}
function UppercaseAction(type, options) {
	return CanInstantiate([type]) ? Update(FromType$11(UppercaseMapping, type), {}, options) : UppercaseDeferred(type, options);
}
function CapitalizeInstantiate(context, state, type, options) {
	return CapitalizeAction(InstantiateType(context, state, type), options);
}
function LowercaseInstantiate(context, state, type, options) {
	return LowercaseAction(InstantiateType(context, state, type), options);
}
function UncapitalizeInstantiate(context, state, type, options) {
	return UncapitalizeAction(InstantiateType(context, state, type), options);
}
function UppercaseInstantiate(context, state, type, options) {
	return UppercaseAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/conditional.mjs
/** Creates a deferred Conditional action. */
function ConditionalDeferred(left, right, true_, false_, options = {}) {
	return Deferred("Conditional", [
		left,
		right,
		true_,
		false_
	], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/conditional/instantiate.mjs
function ConditionalOperation(context, state, left, right, true_, false_) {
	const extendsResult = Extends(context, left, right);
	return IsExtendsUnion(extendsResult) ? Union([InstantiateType(extendsResult.inferred, state, true_), InstantiateType(context, state, false_)]) : IsExtendsTrue(extendsResult) ? InstantiateType(extendsResult.inferred, state, true_) : InstantiateType(context, state, false_);
}
function ConditionalAction(context, state, left, right, true_, false_, options) {
	return CanInstantiate([left, right]) ? Update(ConditionalOperation(context, state, left, right, true_, false_), {}, options) : ConditionalDeferred(left, right, true_, false_, options);
}
function ConditionalInstantiate(context, state, left, right, true_, false_, options) {
	return ConditionalAction(context, state, InstantiateType(context, state, left), InstantiateType(context, state, right), true_, false_, options);
}
//#endregion
//#region node_modules/typebox/build/type/action/constructor_parameters.mjs
/** Creates a deferred ConstructorParameters action. */
function ConstructorParametersDeferred(type, options = {}) {
	return Deferred("ConstructorParameters", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/constructor_parameters/instantiate.mjs
function ConstructorParametersOperation(type) {
	const parameters = IsConstructor(type) ? type["parameters"] : [];
	return Tuple(InstantiateElements({}, State([], []), parameters));
}
function ConstructorParametersAction(type, options) {
	return CanInstantiate([type]) ? Update(ConstructorParametersOperation(type), {}, options) : ConstructorParametersDeferred(type, options);
}
function ConstructorParametersInstantiate(context, state, type, options) {
	return ConstructorParametersAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/exclude.mjs
/** Creates a deferred Exclude action. */
function ExcludeDeferred(left, right, options = {}) {
	return Deferred("Exclude", [left, right], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/exclude/instantiate.mjs
function ExcludeAction(left, right, options) {
	return CanInstantiate([left, right]) ? Update(ExcludeOperation(left, right), {}, options) : ExcludeDeferred(left, right, options);
}
function ExcludeInstantiate(context, state, left, right, options) {
	return ExcludeAction(InstantiateType(context, state, left), InstantiateType(context, state, right), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/extract.mjs
/** Creates a deferred Extract action. */
function ExtractDeferred(left, right, options = {}) {
	return Deferred("Extract", [left, right], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/extract/operation.mjs
function ExtractType(left, right) {
	return IsExtendsTrueLike(Extends({}, left, right)) ? [left] : [];
}
function ExtractUnion(left, right, result = []) {
	return ShiftLeft(left, (head, tail) => ExtractUnion(tail, right, [...result, ...ExtractType(head, right)]), () => result);
}
function ExtractOperation(left, right) {
	const evaluated = EvaluateType(left);
	return EvaluateUnion(ExtractUnion(IsUnion(evaluated) ? evaluated.anyOf : [evaluated], right));
}
//#endregion
//#region node_modules/typebox/build/type/engine/extract/instantiate.mjs
function ExtractAction(left, right, options) {
	return CanInstantiate([left, right]) ? Update(ExtractOperation(left, right), {}, options) : ExtractDeferred(left, right, options);
}
function ExtractInstantiate(context, state, left, right, options) {
	return ExtractAction(InstantiateType(context, state, left), InstantiateType(context, state, right), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/indexed.mjs
/** Creates a deferred Index action. */
function IndexDeferred(type, indexer, options = {}) {
	return Deferred("Index", [type, indexer], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/object/from_cyclic.mjs
function FromCyclic$4(defs, ref) {
	return FromType$10(CyclicTarget(defs, ref));
}
//#endregion
//#region node_modules/typebox/build/type/engine/object/from_dependent.mjs
function FromDependent$4(if_, then_, else_) {
	return FromType$10(EvaluateDependent(if_, then_, else_));
}
//#endregion
//#region node_modules/typebox/build/type/engine/object/from_intersect.mjs
function CollapseIntersectProperties(left, right) {
	const leftKeys = Keys(left).filter((key) => !HasPropertyKey(right, key));
	const rightKeys = Keys(right).filter((key) => !HasPropertyKey(left, key));
	const sharedKeys = Keys(left).filter((key) => HasPropertyKey(right, key));
	const leftProperties = leftKeys.reduce((result, key) => ({
		...result,
		[key]: left[key]
	}), {});
	const rightProperties = rightKeys.reduce((result, key) => ({
		...result,
		[key]: right[key]
	}), {});
	const sharedProperties = sharedKeys.reduce((result, key) => ({
		...result,
		[key]: EvaluateIntersect([left[key], right[key]])
	}), {});
	return Assign(Assign(leftProperties, rightProperties), sharedProperties);
}
function FromIntersect$4(types) {
	return types.reduce((result, left) => {
		return CollapseIntersectProperties(result, FromType$10(left));
	}, {});
}
//#endregion
//#region node_modules/typebox/build/type/engine/object/from_object.mjs
function FromObject$5(properties) {
	return properties;
}
//#endregion
//#region node_modules/typebox/build/type/engine/object/from_tuple.mjs
function FromTuple$3(types) {
	return FromType$10(TupleToObject(Tuple(types)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/object/from_union.mjs
function CollapseUnionProperties(left, right) {
	return Keys(left).filter((key) => key in right).reduce((result, key) => {
		return {
			...result,
			[key]: EvaluateUnion([left[key], right[key]])
		};
	}, {});
}
function ReduceVariants(types, result) {
	return ShiftLeft(types, (left, right) => ReduceVariants(right, CollapseUnionProperties(result, FromType$10(left))), () => result);
}
function FromUnion$5(types) {
	return ShiftLeft(types, (left, right) => ReduceVariants(right, FromType$10(left)), () => Unreachable());
}
//#endregion
//#region node_modules/typebox/build/type/engine/object/from_type.mjs
function FromType$10(type) {
	return IsCyclic(type) ? FromCyclic$4(type.$defs, type.$ref) : IsDependent(type) ? FromDependent$4(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect$4(type.allOf) : IsUnion(type) ? FromUnion$5(type.anyOf) : IsTuple(type) ? FromTuple$3(type.items) : IsObject(type) ? FromObject$5(type.properties) : {};
}
//#endregion
//#region node_modules/typebox/build/type/engine/object/collapse.mjs
/**
* Collapses a type into a TObject schema. This is a lossy fast path used to
* normalize arbitrary TSchema types into a TObject structure. This function is
* primarily used in indexing operations where a normalized object structure
* is required. If the type cannot be collapsed, an empty object schema is returned.
*/
function CollapseToObject(type) {
	return _Object_(FromType$10(type));
}
//#endregion
//#region node_modules/typebox/build/type/engine/helpers/keys.mjs
const integerKeyPattern = /* @__PURE__ */ new RegExp("^(?:0|[1-9][0-9]*)$");
function ConvertToIntegerKey(value) {
	const normal = `${value}`;
	return integerKeyPattern.test(normal) ? parseInt(normal) : value;
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexed/from_array.mjs
function NormalizeLiteral(value) {
	return Literal(ConvertToIntegerKey(value));
}
function NormalizeIndexerTypes(types) {
	return types.map((type) => NormalizeIndexer(type));
}
function NormalizeIndexer(type) {
	return IsIntersect(type) ? Intersect(NormalizeIndexerTypes(type.allOf)) : IsUnion(type) ? Union(NormalizeIndexerTypes(type.anyOf)) : IsLiteral(type) ? NormalizeLiteral(type.const) : type;
}
function FromArray$2(type, indexer) {
	return IsExtendsTrueLike(Extends({}, NormalizeIndexer(indexer), Number$1())) ? type : IsLiteral(indexer) && IsEqual(indexer.const, "length") ? Number$1() : Never();
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/from_cyclic.mjs
function FromCyclic$3(defs, ref) {
	return FromType$9(CyclicTarget(defs, ref));
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/from_dependent.mjs
function FromDependent$3(if_, then_, else_) {
	return FromType$9(EvaluateDependent(if_, then_, else_));
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/from_enum.mjs
function FromEnum$1(values) {
	return FromType$9(EvaluateEnum(values));
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/from_intersect.mjs
function FromIntersect$3(types) {
	return FromType$9(EvaluateIntersect(types));
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/from_literal.mjs
function FromLiteral$1(value) {
	return [`${value}`];
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/from_template_literal.mjs
function FromTemplateLiteral$1(pattern) {
	return FromType$9(EvaluateTemplateLiteral(pattern));
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/from_union.mjs
function FromUnion$4(types) {
	return types.reduce((result, left) => {
		return [...result, ...FromType$9(left)];
	}, []);
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/from_type.mjs
function FromType$9(type) {
	return IsCyclic(type) ? FromCyclic$3(type.$defs, type.$ref) : IsDependent(type) ? FromDependent$3(type.if, type.then, type.else) : IsEnum(type) ? FromEnum$1(type.enum) : IsIntersect(type) ? FromIntersect$3(type.allOf) : IsLiteral(type) ? FromLiteral$1(type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral$1(type.pattern) : IsUnion(type) ? FromUnion$4(type.anyOf) : [];
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/to_indexable_keys.mjs
/**
* Transforms a type meant as an Indexer into string[] array which is used by Indexable types
* like Index, Pick and Omit to select from property keys. This function should only be used
* for Object key selection, and not for Array / Tuple key selection as Array-Like structures
* require TNumber indexing support.
*/
function ToIndexableKeys(type) {
	return FromType$9(type);
}
//#endregion
//#region node_modules/typebox/build/type/engine/this/expand_this.mjs
function FromTypes(properties, types) {
	return types.map((type) => FromType$8(properties, type));
}
function FromType$8(properties, type) {
	return IsArray(type) ? _Array_(FromType$8(properties, type.items)) : IsConstructor(type) ? Constructor(FromTypes(properties, type.parameters), FromType$8(properties, type.instanceType)) : IsFunction(type) ? _Function_(FromTypes(properties, type.parameters), FromType$8(properties, type.returnType)) : IsTuple(type) ? Tuple(FromTypes(properties, type.items)) : IsUnion(type) ? Union(FromTypes(properties, type.anyOf)) : IsIntersect(type) ? Intersect(FromTypes(properties, type.allOf)) : IsThis(type) ? _Object_(properties) : type;
}
function ExpandThis(properties, type) {
	return FromType$8(properties, type);
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexed/from_object.mjs
function IndexProperty(properties, key) {
	return ExpandThis(properties, key in properties ? properties[key] : Never());
}
function IndexProperties(properties, keys) {
	return keys.reduce((result, left) => {
		return [...result, IndexProperty(properties, left)];
	}, []);
}
function FromIndexer(properties, indexer) {
	return EvaluateUnion(IndexProperties(properties, ToIndexableKeys(indexer)));
}
const NumericKeyPattern = new RegExp(IntegerKey);
function NumericKeys(keys) {
	return keys.filter((key) => NumericKeyPattern.test(key));
}
function FromIndexerNumber(properties) {
	return EvaluateUnion(IndexProperties(properties, NumericKeys(PropertyKeys(properties))));
}
function FromObject$4(properties, indexer) {
	return IsNumber(indexer) ? FromIndexerNumber(properties) : FromIndexer(properties, indexer);
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexed/array_indexer.mjs
function ConvertLiteral(value) {
	return Literal(ConvertToIntegerKey(value));
}
function ArrayIndexerTypes(types) {
	return types.map((type) => FormatArrayIndexer(type));
}
/** Formats embedded integer-like strings on an Indexer to be number values inline with TS indexing | coercion behaviors. */
function FormatArrayIndexer(type) {
	return IsIntersect(type) ? Intersect(ArrayIndexerTypes(type.allOf)) : IsUnion(type) ? Union(ArrayIndexerTypes(type.anyOf)) : IsLiteral(type) ? ConvertLiteral(type.const) : type;
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexed/from_tuple.mjs
function IndexElementsWithIndexer(types, indexer) {
	return types.reduceRight((result, right, index) => {
		return IsExtendsTrueLike(Extends({}, Literal(index), indexer)) ? [right, ...result] : result;
	}, []);
}
function FromTupleWithIndexer(types, indexer) {
	return EvaluateUnionFast(IndexElementsWithIndexer(types, FormatArrayIndexer(indexer)));
}
function FromTupleWithoutIndexer(types) {
	return EvaluateUnionFast(types);
}
function FromTuple$2(types, indexer) {
	return IsLiteral(indexer) && IsEqual(indexer.const, "length") ? Literal(types.length) : IsNumber(indexer) || IsInteger(indexer) ? FromTupleWithoutIndexer(types) : FromTupleWithIndexer(types, indexer);
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexed/from_type.mjs
function FromType$7(type, indexer) {
	return IsArray(type) ? FromArray$2(type.items, indexer) : IsObject(type) ? FromObject$4(type.properties, indexer) : IsTuple(type) ? FromTuple$2(type.items, indexer) : Never();
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexed/instantiate.mjs
function NormalizeType$1(type) {
	return IsCyclic(type) || IsDependent(type) || IsIntersect(type) || IsUnion(type) ? CollapseToObject(type) : type;
}
function IndexAction(type, indexer, options) {
	return CanInstantiate([type, indexer]) ? Update(FromType$7(NormalizeType$1(type), indexer), {}, options) : IndexDeferred(type, indexer, options);
}
function IndexInstantiate(context, state, type, indexer, options) {
	return IndexAction(InstantiateType(context, state, type), InstantiateType(context, state, indexer), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/instance_type.mjs
/** Creates a deferred InstanceType action. */
function InstanceTypeDeferred(type, options = {}) {
	return Deferred("InstanceType", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/instance_type/instantiate.mjs
function InstanceTypeOperation(type) {
	return IsConstructor(type) ? type["instanceType"] : Never();
}
function InstanceTypeAction(type, options) {
	return CanInstantiate([type]) ? Update(InstanceTypeOperation(type), {}, options) : InstanceTypeDeferred(type, options);
}
function InstanceTypeInstantiate(context, state, type, options = {}) {
	return InstanceTypeAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/keyof.mjs
/** Creates a deferred KeyOf action. */
function KeyOfDeferred(type, options = {}) {
	return Deferred("KeyOf", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/keyof/from_any.mjs
function FromAny() {
	return Union([
		Number$1(),
		String$1(),
		Symbol()
	]);
}
//#endregion
//#region node_modules/typebox/build/type/engine/keyof/from_array.mjs
function FromArray$1(_type) {
	return Number$1();
}
//#endregion
//#region node_modules/typebox/build/type/engine/keyof/from_object.mjs
function FromPropertyKeys(keys) {
	return keys.reduce((result, left) => {
		return IsLiteralValue(left) ? [...result, Literal(ConvertToIntegerKey(left))] : Unreachable();
	}, []);
}
function FromObject$3(properties) {
	return EvaluateUnionFast(FromPropertyKeys(Keys(properties)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/keyof/from_record.mjs
function FromRecord(type) {
	return RecordKey(type);
}
//#endregion
//#region node_modules/typebox/build/type/engine/keyof/from_tuple.mjs
function FromTuple$1(types) {
	return EvaluateUnionFast(types.map((_, index) => Literal(index)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/keyof/from_type.mjs
function FromType$6(type) {
	return IsAny(type) ? FromAny() : IsArray(type) ? FromArray$1(type.items) : IsObject(type) ? FromObject$3(type.properties) : IsRecord(type) ? FromRecord(type) : IsTuple(type) ? FromTuple$1(type.items) : Never();
}
//#endregion
//#region node_modules/typebox/build/type/engine/keyof/instantiate.mjs
function NormalizeType(type) {
	return IsCyclic(type) || IsDependent(type) || IsIntersect(type) || IsUnion(type) ? CollapseToObject(type) : type;
}
function KeyOfAction(type, options) {
	return CanInstantiate([type]) ? Update(FromType$6(NormalizeType(type)), {}, options) : KeyOfDeferred(type, options);
}
function KeyOfInstantiate(context, state, type, options) {
	return KeyOfAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/mapped.mjs
/** Creates a deferred Mapped action. */
function MappedDeferred(identifier, type, as, property, options = {}) {
	return Deferred("Mapped", [
		identifier,
		type,
		as,
		property
	], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/mapped/mapped_variants.mjs
function FromTemplateLiteral(pattern) {
	return FromType$5(EvaluateTemplateLiteral(pattern));
}
function FromUnion$3(types) {
	return types.reduce((result, left) => {
		return [...result, ...FromType$5(left)];
	}, []);
}
function FromEnum(values) {
	return FromType$5(EvaluateEnum(values));
}
function FromLiteral(value) {
	return IsNumber$1(value) ? [Literal(`${value}`)] : [Literal(value)];
}
function FromType$5(type) {
	return IsEnum(type) ? FromEnum(type.enum) : IsLiteral(type) ? FromLiteral(type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral(type.pattern) : IsUnion(type) ? FromUnion$3(type.anyOf) : [type];
}
function MappedVariants(type) {
	return FromType$5(type);
}
//#endregion
//#region node_modules/typebox/build/type/engine/mapped/mapped_operation.mjs
function CanonicalAs(instantiatedAs) {
	return IsTemplateLiteral(instantiatedAs) ? EvaluateTemplateLiteral(instantiatedAs.pattern) : instantiatedAs;
}
function MappedVariant(context, state, identifier, variant, as, property) {
	const variantContext = Assign(context, { [identifier["name"]]: variant });
	const canonicalAs = CanonicalAs(InstantiateType(variantContext, state, as));
	const instantiatedProperty = InstantiateType(variantContext, state, property);
	return IsLiteralNumber(canonicalAs) || IsLiteralString(canonicalAs) ? { [canonicalAs.const]: instantiatedProperty } : {};
}
function MappedProperties(context, state, identifier, variants, as, property) {
	return variants.reduce((result, left) => {
		return [...result, MappedVariant(context, state, identifier, left, as, property)];
	}, []);
}
function MappedObjects(properties) {
	return properties.reduce((result, left) => {
		return [...result, _Object_(left)];
	}, []);
}
function MappedOperation(context, state, identifier, type, as, property) {
	return EvaluateIntersect(MappedObjects(MappedProperties(context, state, identifier, MappedVariants(type), as, property)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/mapped/instantiate.mjs
function MappedAction(context, state, identifier, type, as, property, options) {
	return CanInstantiate([type]) ? Update(MappedOperation(context, state, identifier, type, as, property), {}, options) : MappedDeferred(identifier, type, as, property, options);
}
function MappedInstantiate(context, state, identifier, type, as, property, options) {
	return MappedAction(context, state, identifier, InstantiateType(context, state, type), as, property, options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/module/instantiate.mjs
function InstantiateCyclics(context, declarations, cyclicKeys) {
	const declarationContext = Assign(context, declarations);
	return Keys(declarations).filter((key) => cyclicKeys.includes(key)).reduce((result, key) => {
		return {
			...result,
			[key]: InstantiateCyclic(declarationContext, key, declarations[key])
		};
	}, {});
}
function InstantiateNonCyclics(context, declarations, cyclicKeys) {
	const declarationContext = Assign(context, declarations);
	return Keys(declarations).filter((key) => !cyclicKeys.includes(key)).reduce((result, key) => {
		return {
			...result,
			[key]: InstantiateType(declarationContext, State([], []), declarations[key])
		};
	}, {});
}
function InstantiateModule(context, declarations, options) {
	const cyclicCandidates = CyclicCandidates(declarations);
	const instantiatedCyclics = InstantiateCyclics(context, declarations, cyclicCandidates);
	const instantiatedNonCyclics = InstantiateNonCyclics(context, declarations, cyclicCandidates);
	return Update({
		...instantiatedCyclics,
		...instantiatedNonCyclics
	}, {}, options);
}
function ModuleInstantiate(context, _state, declarations, options) {
	return InstantiateModule(context, declarations, options);
}
//#endregion
//#region node_modules/typebox/build/type/action/non_nullable.mjs
/** Creates a deferred NonNullable action. */
function NonNullableDeferred(type, options = {}) {
	return Deferred("NonNullable", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/non_nullable/instantiate.mjs
function NonNullableOperation(type) {
	return ExcludeAction(type, Union([Null(), Undefined()]), {});
}
function NonNullableAction(type, options) {
	return CanInstantiate([type]) ? Update(NonNullableOperation(type), {}, options) : NonNullableDeferred(type, options);
}
function NonNullableInstantiate(context, state, type, options) {
	return NonNullableAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/omit.mjs
/** Creates a deferred Omit action. */
function OmitDeferred(type, indexer, options = {}) {
	return Deferred("Omit", [type, indexer], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/indexable/to_indexable.mjs
/** Transforms a type into a TProperties used for indexing operations */
function ToIndexable(type) {
	const collapsed = CollapseToObject(type);
	return IsObject(collapsed) ? collapsed.properties : Unreachable();
}
//#endregion
//#region node_modules/typebox/build/type/engine/omit/from_type.mjs
function FromKeys$1(properties, keys) {
	return Keys(properties).reduce((result, key) => {
		return keys.includes(key) ? result : {
			...result,
			[key]: properties[key]
		};
	}, {});
}
function FromType$4(type, indexer) {
	return _Object_(FromKeys$1(ToIndexable(type), ToIndexableKeys(indexer)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/omit/instantiate.mjs
function OmitAction(type, indexer, options) {
	return CanInstantiate([type, indexer]) ? Update(FromType$4(type, indexer), {}, options) : OmitDeferred(type, indexer, options);
}
function OmitInstantiate(context, state, type, indexer, options) {
	return OmitAction(InstantiateType(context, state, type), InstantiateType(context, state, indexer), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/parameters.mjs
/** Creates a deferred Parameters action. */
function ParametersDeferred(type, options = {}) {
	return Deferred("Parameters", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/parameters/instantiate.mjs
function ParametersOperation(type) {
	const parameters = IsFunction(type) ? type["parameters"] : [];
	return Tuple(InstantiateElements({}, State([], []), parameters));
}
function ParametersAction(type, options) {
	return CanInstantiate([type]) ? Update(ParametersOperation(type), {}, options) : ParametersDeferred(type, options);
}
function ParametersInstantiate(context, state, type, options) {
	return ParametersAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/partial.mjs
/** Creates a deferred Partial action. */
function PartialDeferred(type, options = {}) {
	return Deferred("Partial", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/partial/from_cyclic.mjs
function FromCyclic$2(defs, ref) {
	const partial = FromType$3(CyclicTarget(defs, ref));
	return Cyclic(Assign(defs, { [ref]: partial }), ref);
}
//#endregion
//#region node_modules/typebox/build/type/engine/partial/from_dependent.mjs
function FromDependent$2(if_, then_, else_) {
	return FromType$3(EvaluateDependent(if_, then_, else_));
}
//#endregion
//#region node_modules/typebox/build/type/engine/partial/from_intersect.mjs
function FromIntersect$2(types) {
	return FromType$3(EvaluateIntersect(types));
}
//#endregion
//#region node_modules/typebox/build/type/engine/partial/from_union.mjs
function FromUnion$2(types) {
	return Union(types.map((type) => FromType$3(type)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/partial/from_object.mjs
function FromObject$2(properties) {
	return _Object_(Keys(properties).reduce((result, left) => {
		return {
			...result,
			[left]: AddOptional(properties[left])
		};
	}, {}));
}
//#endregion
//#region node_modules/typebox/build/type/engine/partial/from_type.mjs
function FromType$3(type) {
	return IsCyclic(type) ? FromCyclic$2(type.$defs, type.$ref) : IsDependent(type) ? FromDependent$2(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect$2(type.allOf) : IsUnion(type) ? FromUnion$2(type.anyOf) : IsObject(type) ? FromObject$2(type.properties) : _Object_({});
}
//#endregion
//#region node_modules/typebox/build/type/engine/partial/instantiate.mjs
function PartialAction(type, options) {
	return CanInstantiate([type]) ? Update(FromType$3(type), {}, options) : PartialDeferred(type, options);
}
function PartialInstantiate(context, state, type, options) {
	return PartialAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/pick.mjs
/** Creates a deferred Pick action. */
function PickDeferred(type, indexer, options = {}) {
	return Deferred("Pick", [type, indexer], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/pick/from_type.mjs
function FromKeys(properties, keys) {
	return Keys(properties).reduce((result, key) => {
		return keys.includes(key) ? Assign(result, { [key]: properties[key] }) : result;
	}, {});
}
function FromType$2(type, indexer) {
	return _Object_(FromKeys(ToIndexable(type), ToIndexableKeys(indexer)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/pick/instantiate.mjs
function PickAction(type, indexer, options) {
	return CanInstantiate([type, indexer]) ? Update(FromType$2(type, indexer), {}, options) : PickDeferred(type, indexer, options);
}
function PickInstantiate(context, state, type, indexer, options) {
	return PickAction(InstantiateType(context, state, type), InstantiateType(context, state, indexer), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/readonly_object.mjs
/** Creates a deferred ReadonlyType action. */
function ReadonlyObjectDeferred(type, options = {}) {
	return Deferred("ReadonlyObject", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/from_array.mjs
function FromArray(type) {
	return AddImmutable(_Array_(type));
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/from_cyclic.mjs
function FromCyclic$1(defs, ref) {
	const partial = FromType$1(CyclicTarget(defs, ref));
	return Cyclic(Assign(defs, { [ref]: partial }), ref);
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/from_dependent.mjs
function FromDependent$1(if_, then_, else_) {
	return FromType$1(EvaluateDependent(if_, then_, else_));
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/from_intersect.mjs
function FromIntersect$1(types) {
	return FromType$1(EvaluateIntersect(types));
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/from_object.mjs
function FromObject$1(properties) {
	return _Object_(Keys(properties).reduce((result, left) => {
		return {
			...result,
			[left]: AddReadonly(properties[left])
		};
	}, {}));
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/from_tuple.mjs
function FromTuple(types) {
	return AddImmutable(Tuple(types));
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/from_union.mjs
function FromUnion$1(types) {
	return Union(types.map((type) => FromType$1(type)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/from_type.mjs
function FromType$1(type) {
	return IsArray(type) ? FromArray(type.items) : IsCyclic(type) ? FromCyclic$1(type.$defs, type.$ref) : IsDependent(type) ? FromDependent$1(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect$1(type.allOf) : IsObject(type) ? FromObject$1(type.properties) : IsTuple(type) ? FromTuple(type.items) : IsUnion(type) ? FromUnion$1(type.anyOf) : type;
}
//#endregion
//#region node_modules/typebox/build/type/engine/readonly_object/instantiate.mjs
function ReadonlyObjectAction(type, options) {
	return CanInstantiate([type]) ? Update(FromType$1(type), {}, options) : ReadonlyObjectDeferred(type);
}
function ReadonlyObjectInstantiate(context, state, type, options) {
	return ReadonlyObjectAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/ref/instantiate.mjs
function RefInstantiate(context, state, type, ref) {
	return state.visited.includes(ref) ? type : ref in context ? InstantiateType(context, State(state["callstack"], [...state["visited"], ref]), context[ref]) : type;
}
//#endregion
//#region node_modules/typebox/build/type/engine/required/from_cyclic.mjs
function FromCyclic(defs, ref) {
	const partial = FromType(CyclicTarget(defs, ref));
	return Cyclic(Assign(defs, { [ref]: partial }), ref);
}
//#endregion
//#region node_modules/typebox/build/type/engine/required/from_dependent.mjs
function FromDependent(if_, then_, else_) {
	return FromType(EvaluateDependent(if_, then_, else_));
}
//#endregion
//#region node_modules/typebox/build/type/engine/required/from_intersect.mjs
function FromIntersect(types) {
	return FromType(EvaluateIntersect(types));
}
//#endregion
//#region node_modules/typebox/build/type/engine/required/from_union.mjs
function FromUnion(types) {
	return Union(types.map((type) => FromType(type)));
}
//#endregion
//#region node_modules/typebox/build/type/engine/required/from_object.mjs
function FromObject(properties) {
	return _Object_(Keys(properties).reduce((result, left) => {
		return {
			...result,
			[left]: RemoveOptional(properties[left])
		};
	}, {}));
}
//#endregion
//#region node_modules/typebox/build/type/engine/required/from_type.mjs
function FromType(type) {
	return IsCyclic(type) ? FromCyclic(type.$defs, type.$ref) : IsDependent(type) ? FromDependent(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect(type.allOf) : IsUnion(type) ? FromUnion(type.anyOf) : IsObject(type) ? FromObject(type.properties) : _Object_({});
}
//#endregion
//#region node_modules/typebox/build/type/action/required.mjs
/** Creates a deferred Required action. */
function RequiredDeferred(type, options = {}) {
	return Deferred("Required", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/required/instantiate.mjs
function RequiredAction(type, options) {
	return CanInstantiate([type]) ? Update(FromType(type), {}, options) : RequiredDeferred(type, options);
}
function RequiredInstantiate(context, state, type, options) {
	return RequiredAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/return_type.mjs
/** Creates a deferred ReturnType action. */
function ReturnTypeDeferred(type, options = {}) {
	return Deferred("ReturnType", [type], options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/return_type/instantiate.mjs
function ReturnTypeOperation(type) {
	return IsFunction(type) ? type["returnType"] : Never();
}
function ReturnTypeAction(type, options) {
	return CanInstantiate([type]) ? Update(ReturnTypeOperation(type), {}, options) : ReturnTypeDeferred(type, options);
}
function ReturnTypeInstantiate(context, state, type, options = {}) {
	return ReturnTypeAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/with.mjs
/** Creates a deferred With action. */
function WithDeferred(type, options) {
	return Deferred("With", [type, options], {});
}
//#endregion
//#region node_modules/typebox/build/type/engine/with/instantiate.mjs
function WithAction(type, options) {
	return CanInstantiate([type]) ? Update(type, {}, options) : WithDeferred(type, options);
}
function WithInstantiate(context, state, type, options) {
	return WithAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/engine/rest/spread.mjs
function SpreadElement(type) {
	return IsRest(type) ? IsTuple(type.items) ? RestSpread(type.items.items) : IsInfer(type.items) ? [type] : IsRef(type.items) ? [type] : [Never()] : [type];
}
function RestSpread(types) {
	return types.reduce((result, left) => {
		return [...result, ...SpreadElement(left)];
	}, []);
}
//#endregion
//#region node_modules/typebox/build/type/engine/instantiate.mjs
function State(callstack, visited) {
	return {
		callstack,
		visited
	};
}
function CanInstantiate(types) {
	return ShiftLeft(types, (left, right) => IsRef(left) ? false : CanInstantiate(right), () => true);
}
function InstantiateProperties(context, state, properties) {
	return Keys(properties).reduce((result, key) => {
		return {
			...result,
			[key]: InstantiateType(context, state, properties[key])
		};
	}, {});
}
function InstantiateElements(context, state, types) {
	return RestSpread(InstantiateTypes(context, state, types));
}
function InstantiateTypes(context, state, types) {
	return types.map((type) => InstantiateType(context, state, type));
}
function WithModifiers(type, instantiatedType) {
	const withOptional = IsOptional(type) ? AddOptionalAction(instantiatedType, {}) : instantiatedType;
	const withReadonly = IsReadonly(type) ? AddReadonlyAction(withOptional, {}) : withOptional;
	return IsImmutable(type) ? AddImmutableAction(withReadonly, {}) : withReadonly;
}
function InstantiateDeferred(context, state, action, parameters, options) {
	return IsEqual(action, "AddImmutable") ? AddImmutableInstantiate(context, state, parameters[0], options) : IsEqual(action, "RemoveImmutable") ? RemoveImmutableInstantiate(context, state, parameters[0], options) : IsEqual(action, "AddReadonly") ? AddReadonlyInstantiate(context, state, parameters[0], options) : IsEqual(action, "RemoveReadonly") ? RemoveReadonlyInstantiate(context, state, parameters[0], options) : IsEqual(action, "AddOptional") ? AddOptionalInstantiate(context, state, parameters[0], options) : IsEqual(action, "RemoveOptional") ? RemoveOptionalInstantiate(context, state, parameters[0], options) : IsEqual(action, "Capitalize") ? CapitalizeInstantiate(context, state, parameters[0], options) : IsEqual(action, "Conditional") ? ConditionalInstantiate(context, state, parameters[0], parameters[1], parameters[2], parameters[3], options) : IsEqual(action, "ConstructorParameters") ? ConstructorParametersInstantiate(context, state, parameters[0], options) : IsEqual(action, "Evaluate") ? EvaluateInstantiate(context, state, parameters[0], options) : IsEqual(action, "Exclude") ? ExcludeInstantiate(context, state, parameters[0], parameters[1], options) : IsEqual(action, "Extract") ? ExtractInstantiate(context, state, parameters[0], parameters[1], options) : IsEqual(action, "Index") ? IndexInstantiate(context, state, parameters[0], parameters[1], options) : IsEqual(action, "InstanceType") ? InstanceTypeInstantiate(context, state, parameters[0], options) : IsEqual(action, "Interface") ? InterfaceInstantiate(context, state, parameters[0], parameters[1], options) : IsEqual(action, "KeyOf") ? KeyOfInstantiate(context, state, parameters[0], options) : IsEqual(action, "Lowercase") ? LowercaseInstantiate(context, state, parameters[0], options) : IsEqual(action, "Mapped") ? MappedInstantiate(context, state, parameters[0], parameters[1], parameters[2], parameters[3], options) : IsEqual(action, "Module") ? ModuleInstantiate(context, state, parameters[0], options) : IsEqual(action, "NonNullable") ? NonNullableInstantiate(context, state, parameters[0], options) : IsEqual(action, "Pick") ? PickInstantiate(context, state, parameters[0], parameters[1], options) : IsEqual(action, "Parameters") ? ParametersInstantiate(context, state, parameters[0], options) : IsEqual(action, "Partial") ? PartialInstantiate(context, state, parameters[0], options) : IsEqual(action, "Omit") ? OmitInstantiate(context, state, parameters[0], parameters[1], options) : IsEqual(action, "ReadonlyObject") ? ReadonlyObjectInstantiate(context, state, parameters[0], options) : IsEqual(action, "Record") ? RecordInstantiate(context, state, parameters[0], parameters[1], options) : IsEqual(action, "Required") ? RequiredInstantiate(context, state, parameters[0], options) : IsEqual(action, "ReturnType") ? ReturnTypeInstantiate(context, state, parameters[0], options) : IsEqual(action, "TemplateLiteral") ? TemplateLiteralInstantiate(context, state, parameters[0], options) : IsEqual(action, "Uncapitalize") ? UncapitalizeInstantiate(context, state, parameters[0], options) : IsEqual(action, "Uppercase") ? UppercaseInstantiate(context, state, parameters[0], options) : IsEqual(action, "With") ? WithInstantiate(context, state, parameters[0], parameters[1]) : Deferred(action, parameters, options);
}
function InstantiateImmediate(context, state, type) {
	return WithModifiers(type, IsRef(type) ? RefInstantiate(context, state, type, type.$ref) : IsArray(type) ? _Array_(InstantiateType(context, state, type.items), ArrayOptions(type)) : IsCall(type) ? CallInstantiate(context, state, type.target, type.arguments) : IsConstructor(type) ? Constructor(InstantiateTypes(context, state, type.parameters), InstantiateType(context, state, type.instanceType), ConstructorOptions(type)) : IsFunction(type) ? _Function_(InstantiateTypes(context, state, type.parameters), InstantiateType(context, state, type.returnType), FunctionOptions(type)) : IsDependent(type) ? Dependent(InstantiateType(context, state, type.if), InstantiateType(context, state, type.then), InstantiateType(context, state, type.else), DependentOptions(type)) : IsIntersect(type) ? Intersect(InstantiateTypes(context, state, type.allOf), IntersectOptions(type)) : IsObject(type) ? _Object_(InstantiateProperties(context, state, type.properties), ObjectOptions(type)) : IsRecord(type) ? RecordFromPattern(RecordPattern(type), InstantiateType(context, state, RecordValue(type))) : IsRest(type) ? Rest(InstantiateType(context, state, type.items)) : IsTuple(type) ? Tuple(InstantiateElements(context, state, type.items), TupleOptions(type)) : IsUnion(type) ? Union(InstantiateTypes(context, state, type.anyOf), UnionOptions(type)) : type);
}
function InstantiateType(context, state, type) {
	return IsDeferred(type) ? InstantiateDeferred(context, state, type.action, type.parameters, type.options) : InstantiateImmediate(context, state, type);
}
//#endregion
//#region node_modules/typebox/build/type/engine/immutable/instantiate_add.mjs
function AddImmutableOperation(type) {
	return Update(type, { "~immutable": true }, {});
}
function AddImmutableAction(type, options) {
	return Update(AddImmutableOperation(type), {}, options);
}
function AddImmutableInstantiate(context, state, type, options) {
	return AddImmutableAction(InstantiateType(context, state, type), options);
}
//#endregion
//#region node_modules/typebox/build/type/action/_add_immutable.mjs
/** Applies an AddImmutable action to a type. */
function AddImmutable(type, options = {}) {
	return AddImmutableAction(type, options);
}
//#endregion
//#region src/jev.ts
const JEV_MODEL = "typesafe/jev-1.13";
const JEV_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";
const DEFAULT_JEV_TIMEOUT_MS = 9e4;
function abortError() {
	const error = /* @__PURE__ */ new Error("operation aborted");
	error.name = "AbortError";
	return error;
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validateQuestions(questions) {
	const names = Object.keys(questions);
	if (names.length === 0) throw new Error("askJev requires at least one question");
	for (const name of names) {
		const question = questions[name];
		if (!isRecord(question)) throw new Error(`askJev question '${name}' must be an object`);
		if (question.type !== "noul" && question.type !== "choice" && question.type !== "score") throw new Error(`askJev question '${name}' has invalid type`);
		if (typeof question.instructions !== "string" || question.instructions.length === 0) throw new Error(`askJev question '${name}' requires non-empty instructions`);
		if (!("criteria" in question)) throw new Error(`askJev question '${name}' requires criteria`);
		if (question.type === "noul") {
			const criteria = question.criteria;
			if (!isRecord(criteria) || !("true" in criteria) || !("false" in criteria)) throw new Error(`askJev question '${name}' of type 'noul' requires criteria with 'true' and 'false' entries, e.g. { true: '...', false: '...' }; the JEV API rejects any other shape with 400 invalid_union`);
		}
	}
}
function validateResponse(value, questions) {
	if (!isRecord(value)) throw new Error("JEV response was not an object");
	const { model, answers, usage, id, provider } = value;
	if (typeof model !== "string" || model.length === 0) throw new Error("JEV response had invalid model");
	if (!isRecord(answers)) throw new Error("JEV response had invalid answers");
	if (typeof id !== "string" || id.length === 0) throw new Error("JEV response had invalid id");
	if (typeof provider !== "string" || provider.length === 0) throw new Error("JEV response had invalid provider");
	if (!("usage" in value)) throw new Error("JEV response had missing usage");
	const validatedAnswers = {};
	for (const name of Object.keys(questions)) {
		const expected = questions[name];
		if (expected === void 0) continue;
		const answer = answers[name];
		if (!isRecord(answer)) throw new Error(`JEV response was missing answer '${name}'`);
		if (answer["type"] !== expected.type) throw new Error(`JEV answer '${name}' had wrong type`);
		validatedAnswers[name] = answer;
	}
	return {
		model,
		answers: validatedAnswers,
		usage,
		id,
		provider
	};
}
async function readErrorBody(response) {
	try {
		return (await response.text()).replace(/\s+/g, " ").trim().slice(0, 500);
	} catch {
		return "";
	}
}
async function askJev(state, questions, control = {}) {
	if (typeof state !== "string" || state.length === 0) throw new Error("askJev requires a non-empty state string");
	if (!isRecord(questions)) throw new Error("askJev requires a questions object");
	validateQuestions(questions);
	const apiKey = process.env["OPENROUTER_API_KEY"]?.trim();
	if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
	const timeoutMs = control.timeoutMs ?? 9e4;
	if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("askJev timeoutMs must be a positive integer");
	const timeoutController = new AbortController();
	const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
	const signal = control.signal === void 0 ? timeoutController.signal : AbortSignal.any([timeoutController.signal, control.signal]);
	if (signal.aborted) {
		clearTimeout(timeout);
		throw abortError();
	}
	let response;
	try {
		response = await fetch(JEV_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: JEV_MODEL,
				state,
				questions
			}),
			signal
		});
	} catch (error) {
		clearTimeout(timeout);
		if (error instanceof Error && error.name === "AbortError") {
			if (timeoutController.signal.aborted && !control.signal?.aborted) {
				const timeoutError = /* @__PURE__ */ new Error(`JEV request timed out after ${timeoutMs}ms`);
				timeoutError.name = "TimeoutError";
				throw timeoutError;
			}
			throw abortError();
		}
		throw error;
	}
	clearTimeout(timeout);
	if (!response.ok) {
		const body = await readErrorBody(response);
		throw new Error(`JEV request failed with status ${response.status}${body ? `: ${body}` : ""}`);
	}
	let value;
	try {
		value = await response.json();
	} catch (error) {
		throw new Error(`JEV response was not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
	}
	return validateResponse(value, questions);
}
//#endregion
//#region src/index.ts
const JevQuestionSchema = _Object_({
	type: Union([
		Literal("noul"),
		Literal("choice"),
		Literal("score")
	]),
	instructions: String$1({
		minLength: 1,
		description: "What the model must evaluate for this question."
	}),
	criteria: Any({ description: "Per-type criteria. noul REQUIRES an object with 'true' and 'false' entries, e.g. {\"true\": \"Urgent\", \"false\": \"Not urgent\"}; any other shape fails. choice takes an object mapping each option name to its description. score takes an array of level labels." })
});
const AskJevInputSchema = _Object_({
	state: String$1({
		minLength: 1,
		description: "The full state/context string the model evaluates."
	}),
	questions: Record(String$1({ minLength: 1 }), JevQuestionSchema, {
		minProperties: 1,
		description: "At least one named question to evaluate against the state."
	})
});
function prettyPrint(value) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}
function toolResult(response) {
	return {
		content: [{
			type: "text",
			text: prettyPrint(response)
		}],
		details: response
	};
}
function pieJevExtension(pi) {
	pi.registerTool({
		name: "ask_jev",
		label: "Ask JEV",
		description: "Ask JEV (OpenRouter Decisions API) a structured state/questions evaluation. Requires explicit state and questions; do not invent them.",
		promptSnippet: "Ask JEV with explicit state and questions",
		promptGuidelines: ["Use ask_jev when you have an explicit state string and structured questions to evaluate with JEV."],
		parameters: AskJevInputSchema,
		async execute(_toolCallId, params, signal) {
			return toolResult(await askJev(params.state, params.questions, { signal }));
		},
		renderCall(args, theme, context) {
			const names = Object.keys(args.questions).join(", ");
			const summary = `${theme.fg("success", theme.bold("ask_jev"))}${theme.fg("muted", ` · ${names}`)}`;
			if (!context.expanded) return new Text(summary, 0, 0);
			return new Text(`${summary}\n${theme.fg("success", "Prompt:")}\n${theme.fg("success", prettyPrint({
				state: args.state,
				questions: args.questions
			}))}`, 0, 0);
		},
		renderResult(result, options, theme, context) {
			if (!options.expanded) return new Text("", 0, 0);
			const details = result.details;
			const textBody = String(result.content.find((item) => item.type === "text")?.text ?? "");
			if (context.isError || details === void 0 || typeof details === "object" && Object.keys(details).length === 0) return new Text(`\n${theme.fg("error", textBody.trim() === "" ? "Unknown error" : textBody)}`, 0, 0);
			return new Text(`\n${theme.fg("border", "Response:")}\n${theme.fg("border", prettyPrint(details))}`, 0, 0);
		}
	});
}
//#endregion
export { DEFAULT_JEV_TIMEOUT_MS, JEV_ENDPOINT, JEV_MODEL, askJev, pieJevExtension as default, prettyPrint };
