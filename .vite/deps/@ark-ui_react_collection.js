import {
  require_jsx_runtime
} from "./chunk-QMB4EZJW.js";
import {
  require_react_dom
} from "./chunk-TZ6YGNQO.js";
import {
  __toESM,
  require_react
} from "./chunk-L7NLMYY4.js";

// node_modules/.pnpm/@zag-js+collection@1.43.0/node_modules/@zag-js/collection/dist/chunk-QZ7TP4HQ.mjs
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/.pnpm/@zag-js+utils@1.43.0/node_modules/@zag-js/utils/dist/array.mjs
function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}
var last = (v) => v[v.length - 1];
function nextIndex(v, idx, opts = {}) {
  const { step = 1, loop = true } = opts;
  const next2 = idx + step;
  const len = v.length;
  const last2 = len - 1;
  if (idx === -1) return step > 0 ? 0 : last2;
  if (next2 < 0) return loop ? last2 : 0;
  if (next2 >= len) return loop ? 0 : idx > len ? len : idx;
  return next2;
}
function prevIndex(v, idx, opts = {}) {
  const { step = 1, loop = true } = opts;
  return nextIndex(v, idx, { step: -step, loop });
}
function chunk(v, size) {
  return v.reduce((rows, value, index) => {
    if (index % size === 0) rows.push([value]);
    else last(rows)?.push(value);
    return rows;
  }, []);
}

// node_modules/.pnpm/@zag-js+utils@1.43.0/node_modules/@zag-js/utils/dist/equal.mjs
var isArrayLike = (value) => value?.constructor.name === "Array";
var isArrayEqual = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!isEqual(a[i], b[i])) return false;
  }
  return true;
};
var isEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (a == null && b != null || a != null && b == null) return false;
  if (typeof a?.isEqual === "function" && typeof b?.isEqual === "function") {
    return a.isEqual(b);
  }
  if (typeof a === "function" && typeof b === "function") {
    return a.toString() === b.toString();
  }
  if (isArrayLike(a) && isArrayLike(b)) {
    return isArrayEqual(Array.from(a), Array.from(b));
  }
  if (!(typeof a === "object") || !(typeof b === "object")) return false;
  const keys = Object.keys(b ?? /* @__PURE__ */ Object.create(null));
  const length = keys.length;
  for (let i = 0; i < length; i++) {
    const hasKey = Reflect.has(a, keys[i]);
    if (!hasKey) return false;
  }
  for (let i = 0; i < length; i++) {
    const key = keys[i];
    if (!isEqual(a[key], b[key])) return false;
  }
  return true;
};

// node_modules/.pnpm/@zag-js+utils@1.43.0/node_modules/@zag-js/utils/dist/guard.mjs
var isArray = (v) => Array.isArray(v);
var isObjectLike = (v) => v != null && typeof v === "object";
var isObject = (v) => isObjectLike(v) && !isArray(v);
var isString = (v) => typeof v === "string";
var isFunction = (v) => typeof v === "function";
var hasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
var baseGetTag = (v) => Object.prototype.toString.call(v);
var fnToString = Function.prototype.toString;
var objectCtorString = fnToString.call(Object);
var isPlainObject = (v) => {
  if (!isObjectLike(v) || baseGetTag(v) != "[object Object]" || isFrameworkElement(v)) return false;
  const proto = Object.getPrototypeOf(v);
  if (proto === null) return true;
  const Ctor = hasProp(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && fnToString.call(Ctor) == objectCtorString;
};
var isReactElement = (x) => typeof x === "object" && x !== null && "$$typeof" in x && "props" in x;
var isVueElement = (x) => typeof x === "object" && x !== null && "__v_isVNode" in x;
var isFrameworkElement = (x) => isReactElement(x) || isVueElement(x);

// node_modules/.pnpm/@zag-js+utils@1.43.0/node_modules/@zag-js/utils/dist/functions.mjs
var identity = (v) => v();
var callAll = (...fns) => (...a) => {
  fns.forEach(function(fn) {
    fn?.(...a);
  });
};

// node_modules/.pnpm/@zag-js+utils@1.43.0/node_modules/@zag-js/utils/dist/number.mjs
var { floor, abs, round, min, max, pow, sign } = Math;

// node_modules/.pnpm/@zag-js+utils@1.43.0/node_modules/@zag-js/utils/dist/object.mjs
function compact(obj) {
  if (!isPlainObject(obj) || obj === void 0) return obj;
  const keys2 = Reflect.ownKeys(obj).filter((key) => typeof key === "string");
  const filtered = {};
  for (const key of keys2) {
    const value = obj[key];
    if (value !== void 0) {
      filtered[key] = compact(value);
    }
  }
  return filtered;
}

// node_modules/.pnpm/@zag-js+utils@1.43.0/node_modules/@zag-js/utils/dist/timers.mjs
var _tick;
_tick = /* @__PURE__ */ new WeakMap();

// node_modules/.pnpm/@zag-js+utils@1.43.0/node_modules/@zag-js/utils/dist/warning.mjs
function warn(...a) {
  const m = a.length === 1 ? a[0] : a[1];
  const c = a.length === 2 ? a[0] : true;
  if (c && true) {
    console.warn(m);
  }
}
function invariant(...a) {
  const m = a.length === 1 ? a[0] : a[1];
  const c = a.length === 2 ? a[0] : true;
  if (c && true) {
    throw new Error(m);
  }
}
function ensure(c, m) {
  if (c == null) throw new Error(m());
}
function ensureProps(props, keys, scope) {
  let missingKeys = [];
  for (const key of keys) {
    if (props[key] == null) missingKeys.push(key);
  }
  if (missingKeys.length > 0)
    throw new Error(`[zag-js${scope ? ` > ${scope}` : ""}] missing required props: ${missingKeys.join(", ")}`);
}

// node_modules/.pnpm/@zag-js+collection@1.43.0/node_modules/@zag-js/collection/dist/list-collection.mjs
var fallback = {
  itemToValue(item) {
    if (typeof item === "string") return item;
    if (isObject(item) && hasProp(item, "value")) return item.value;
    return "";
  },
  itemToString(item) {
    if (typeof item === "string") return item;
    if (isObject(item) && hasProp(item, "label")) return item.label;
    return fallback.itemToValue(item);
  },
  isItemDisabled(item) {
    if (isObject(item) && hasProp(item, "disabled")) return !!item.disabled;
    return false;
  }
};
var ListCollection = class _ListCollection {
  constructor(options) {
    __publicField(this, "options", options);
    __publicField(this, "items");
    __publicField(this, "indexMap", null);
    __publicField(this, "copy", (items) => {
      return new _ListCollection({ ...this.options, items: items ?? [...this.items] });
    });
    __publicField(this, "isEqual", (other) => {
      return isEqual(this.items, other.items);
    });
    __publicField(this, "setItems", (items) => {
      return this.copy(items);
    });
    __publicField(this, "getValues", (items = this.items) => {
      const values = [];
      for (const item of items) {
        const value = this.getItemValue(item);
        if (value != null) values.push(value);
      }
      return values;
    });
    __publicField(this, "find", (value) => {
      if (value == null) return null;
      const index = this.indexOf(value);
      return index !== -1 ? this.at(index) : null;
    });
    __publicField(this, "findMany", (values) => {
      const result = [];
      for (const value of values) {
        const item = this.find(value);
        if (item != null) result.push(item);
      }
      return result;
    });
    __publicField(this, "at", (index) => {
      if (!this.options.groupBy && !this.options.groupSort) {
        return this.items[index] ?? null;
      }
      let idx = 0;
      const groups = this.group();
      for (const [, items] of groups) {
        for (const item of items) {
          if (idx === index) return item;
          idx++;
        }
      }
      return null;
    });
    __publicField(this, "sortFn", (valueA, valueB) => {
      const indexA = this.indexOf(valueA);
      const indexB = this.indexOf(valueB);
      return (indexA ?? 0) - (indexB ?? 0);
    });
    __publicField(this, "sort", (values) => {
      return [...values].sort(this.sortFn.bind(this));
    });
    __publicField(this, "getItemValue", (item) => {
      if (item == null) return null;
      return this.options.itemToValue?.(item) ?? fallback.itemToValue(item);
    });
    __publicField(this, "getItemDisabled", (item) => {
      if (item == null) return false;
      return this.options.isItemDisabled?.(item) ?? fallback.isItemDisabled(item);
    });
    __publicField(this, "stringifyItem", (item) => {
      if (item == null) return null;
      return this.options.itemToString?.(item) ?? fallback.itemToString(item);
    });
    __publicField(this, "stringify", (value) => {
      if (value == null) return null;
      return this.stringifyItem(this.find(value));
    });
    __publicField(this, "stringifyItems", (items, separator = ", ") => {
      const strs = [];
      for (const item of items) {
        const str = this.stringifyItem(item);
        if (str != null) strs.push(str);
      }
      return strs.join(separator);
    });
    __publicField(this, "stringifyMany", (value, separator) => {
      return this.stringifyItems(this.findMany(value), separator);
    });
    __publicField(this, "has", (value) => {
      return this.indexOf(value) !== -1;
    });
    __publicField(this, "hasItem", (item) => {
      if (item == null) return false;
      return this.has(this.getItemValue(item));
    });
    __publicField(this, "group", () => {
      const { groupBy, groupSort } = this.options;
      if (!groupBy) return [["", [...this.items]]];
      const groups = /* @__PURE__ */ new Map();
      this.items.forEach((item, index) => {
        const groupKey = groupBy(item, index);
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey).push(item);
      });
      let entries = Array.from(groups.entries());
      if (groupSort) {
        entries.sort(([a], [b]) => {
          if (typeof groupSort === "function") return groupSort(a, b);
          if (Array.isArray(groupSort)) {
            const indexA = groupSort.indexOf(a);
            const indexB = groupSort.indexOf(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          }
          if (groupSort === "asc") return a.localeCompare(b);
          if (groupSort === "desc") return b.localeCompare(a);
          return 0;
        });
      }
      return entries;
    });
    __publicField(this, "getNextValue", (value, step = 1, clamp2 = false) => {
      let index = this.indexOf(value);
      if (index === -1) return null;
      index = clamp2 ? Math.min(index + step, this.size - 1) : index + step;
      while (index <= this.size && this.getItemDisabled(this.at(index))) index++;
      return this.getItemValue(this.at(index));
    });
    __publicField(this, "getPreviousValue", (value, step = 1, clamp2 = false) => {
      let index = this.indexOf(value);
      if (index === -1) return null;
      index = clamp2 ? Math.max(index - step, 0) : index - step;
      while (index >= 0 && this.getItemDisabled(this.at(index))) index--;
      return this.getItemValue(this.at(index));
    });
    __publicField(this, "indexOf", (value) => {
      if (value == null) return -1;
      if (!this.options.groupBy && !this.options.groupSort) {
        return this.items.findIndex((item) => this.getItemValue(item) === value);
      }
      if (!this.indexMap) {
        this.indexMap = /* @__PURE__ */ new Map();
        let idx = 0;
        const groups = this.group();
        for (const [, items] of groups) {
          for (const item of items) {
            const itemValue = this.getItemValue(item);
            if (itemValue != null) {
              this.indexMap.set(itemValue, idx);
            }
            idx++;
          }
        }
      }
      return this.indexMap.get(value) ?? -1;
    });
    __publicField(this, "getByText", (text, current) => {
      const currentIndex = current != null ? this.indexOf(current) : -1;
      const isSingleKey = text.length === 1;
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[(currentIndex + i + 1) % this.items.length];
        if (isSingleKey && this.getItemValue(item) === current) continue;
        if (this.getItemDisabled(item)) continue;
        if (match(this.stringifyItem(item), text)) return item;
      }
      return void 0;
    });
    __publicField(this, "search", (queryString, options2) => {
      const { state, currentValue, timeout = 350 } = options2;
      const search = state.keysSoFar + queryString;
      const isRepeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
      const query = isRepeated ? search[0] : search;
      const item = this.getByText(query, currentValue);
      const value = this.getItemValue(item);
      function cleanup() {
        clearTimeout(state.timer);
        state.timer = -1;
      }
      function update(value2) {
        state.keysSoFar = value2;
        cleanup();
        if (value2 !== "") {
          state.timer = +setTimeout(() => {
            update("");
            cleanup();
          }, timeout);
        }
      }
      update(search);
      return value;
    });
    __publicField(this, "update", (value, item) => {
      let index = this.indexOf(value);
      if (index === -1) return this;
      return this.copy([...this.items.slice(0, index), item, ...this.items.slice(index + 1)]);
    });
    __publicField(this, "upsert", (value, item, mode = "append") => {
      let index = this.indexOf(value);
      if (index === -1) {
        const fn = mode === "append" ? this.append : this.prepend;
        return fn(item);
      }
      return this.copy([...this.items.slice(0, index), item, ...this.items.slice(index + 1)]);
    });
    __publicField(this, "insert", (index, ...items) => {
      return this.copy(insert(this.items, index, ...items));
    });
    __publicField(this, "insertBefore", (value, ...items) => {
      let toIndex = this.indexOf(value);
      if (toIndex === -1) {
        if (this.items.length === 0) toIndex = 0;
        else return this;
      }
      return this.copy(insert(this.items, toIndex, ...items));
    });
    __publicField(this, "insertAfter", (value, ...items) => {
      let toIndex = this.indexOf(value);
      if (toIndex === -1) {
        if (this.items.length === 0) toIndex = 0;
        else return this;
      }
      return this.copy(insert(this.items, toIndex + 1, ...items));
    });
    __publicField(this, "prepend", (...items) => {
      return this.copy(insert(this.items, 0, ...items));
    });
    __publicField(this, "append", (...items) => {
      return this.copy(insert(this.items, this.items.length, ...items));
    });
    __publicField(this, "filter", (fn) => {
      const filteredItems = this.items.filter((item, index) => fn(this.stringifyItem(item), index, item));
      return this.copy(filteredItems);
    });
    __publicField(this, "remove", (...itemsOrValues) => {
      const values = itemsOrValues.map(
        (itemOrValue) => typeof itemOrValue === "string" ? itemOrValue : this.getItemValue(itemOrValue)
      );
      return this.copy(
        this.items.filter((item) => {
          const value = this.getItemValue(item);
          if (value == null) return false;
          return !values.includes(value);
        })
      );
    });
    __publicField(this, "move", (value, toIndex) => {
      const fromIndex = this.indexOf(value);
      if (fromIndex === -1) return this;
      return this.copy(move(this.items, [fromIndex], toIndex));
    });
    __publicField(this, "moveBefore", (value, ...values) => {
      let toIndex = this.items.findIndex((item) => this.getItemValue(item) === value);
      if (toIndex === -1) return this;
      let indices = values.map((value2) => this.items.findIndex((item) => this.getItemValue(item) === value2)).sort((a, b) => a - b);
      return this.copy(move(this.items, indices, toIndex));
    });
    __publicField(this, "moveAfter", (value, ...values) => {
      let toIndex = this.items.findIndex((item) => this.getItemValue(item) === value);
      if (toIndex === -1) return this;
      let indices = values.map((value2) => this.items.findIndex((item) => this.getItemValue(item) === value2)).sort((a, b) => a - b);
      return this.copy(move(this.items, indices, toIndex + 1));
    });
    __publicField(this, "reorder", (fromIndex, toIndex) => {
      return this.copy(move(this.items, [fromIndex], toIndex));
    });
    __publicField(this, "compareValue", (a, b) => {
      const indexA = this.indexOf(a);
      const indexB = this.indexOf(b);
      if (indexA < indexB) return -1;
      if (indexA > indexB) return 1;
      return 0;
    });
    __publicField(this, "range", (from, to) => {
      let keys = [];
      let key = from;
      while (key != null) {
        let item = this.find(key);
        if (item) keys.push(key);
        if (key === to) return keys;
        key = this.getNextValue(key);
      }
      return [];
    });
    __publicField(this, "getValueRange", (from, to) => {
      if (from && to) {
        if (this.compareValue(from, to) <= 0) {
          return this.range(from, to);
        }
        return this.range(to, from);
      }
      return [];
    });
    __publicField(this, "toString", () => {
      let result = "";
      for (const item of this.items) {
        const value = this.getItemValue(item);
        const label = this.stringifyItem(item);
        const disabled = this.getItemDisabled(item);
        const itemString = [value, label, disabled].filter(Boolean).join(":");
        result += itemString + ",";
      }
      return result;
    });
    __publicField(this, "toJSON", () => {
      return {
        size: this.size,
        first: this.firstValue,
        last: this.lastValue
      };
    });
    this.items = [...options.items];
  }
  /**
   * Returns the number of items in the collection
   */
  get size() {
    return this.items.length;
  }
  /**
   * Returns the first value in the collection
   */
  get firstValue() {
    let index = 0;
    while (this.getItemDisabled(this.at(index))) index++;
    return this.getItemValue(this.at(index));
  }
  /**
   * Returns the last value in the collection
   */
  get lastValue() {
    let index = this.size - 1;
    while (this.getItemDisabled(this.at(index))) index--;
    return this.getItemValue(this.at(index));
  }
  *[Symbol.iterator]() {
    yield* this.items;
  }
};
var match = (label, query) => {
  return !!label?.toLowerCase().startsWith(query.toLowerCase());
};
function insert(items, index, ...values) {
  return [...items.slice(0, index), ...values, ...items.slice(index)];
}
function move(items, indices, toIndex) {
  indices = [...indices].sort((a, b) => a - b);
  const itemsToMove = indices.map((i) => items[i]);
  for (let i = indices.length - 1; i >= 0; i--) {
    items = [...items.slice(0, indices[i]), ...items.slice(indices[i] + 1)];
  }
  toIndex = Math.max(0, toIndex - indices.filter((i) => i < toIndex).length);
  return [...items.slice(0, toIndex), ...itemsToMove, ...items.slice(toIndex)];
}

// node_modules/.pnpm/@zag-js+collection@1.43.0/node_modules/@zag-js/collection/dist/grid-collection.mjs
var GridCollection = class extends ListCollection {
  constructor(options) {
    const { columnCount } = options;
    super(options);
    __publicField(this, "columnCount");
    __publicField(this, "rows", null);
    __publicField(this, "getRows", () => {
      if (!this.rows) {
        this.rows = chunk([...this.items], this.columnCount);
      }
      return this.rows;
    });
    __publicField(this, "getRowCount", () => {
      return Math.ceil(this.items.length / this.columnCount);
    });
    __publicField(this, "getCellIndex", (row, column) => {
      return row * this.columnCount + column;
    });
    __publicField(this, "getCell", (row, column) => {
      return this.at(this.getCellIndex(row, column));
    });
    __publicField(this, "getValueCell", (value) => {
      const index = this.indexOf(value);
      if (index === -1) return null;
      const row = Math.floor(index / this.columnCount);
      const column = index % this.columnCount;
      return { row, column };
    });
    __publicField(this, "getLastEnabledColumnIndex", (row) => {
      for (let col = this.columnCount - 1; col >= 0; col--) {
        const cell = this.getCell(row, col);
        if (cell && !this.getItemDisabled(cell)) {
          return col;
        }
      }
      return null;
    });
    __publicField(this, "getFirstEnabledColumnIndex", (row) => {
      for (let col = 0; col < this.columnCount; col++) {
        const cell = this.getCell(row, col);
        if (cell && !this.getItemDisabled(cell)) {
          return col;
        }
      }
      return null;
    });
    __publicField(this, "getPreviousRowValue", (value, loop = false) => {
      const currentCell = this.getValueCell(value);
      if (currentCell === null) return null;
      const rows = this.getRows();
      const rowCount = rows.length;
      let prevRowIndex = currentCell.row;
      let prevColumnIndex = currentCell.column;
      for (let i = 1; i <= rowCount; i++) {
        prevRowIndex = prevIndex(rows, prevRowIndex, { loop });
        const prevRow = rows[prevRowIndex];
        if (!prevRow) continue;
        const prevCell = prevRow[prevColumnIndex];
        if (!prevCell) {
          const lastColumnIndex = this.getLastEnabledColumnIndex(prevRowIndex);
          if (lastColumnIndex != null) {
            prevColumnIndex = lastColumnIndex;
          }
        }
        const cell = this.getCell(prevRowIndex, prevColumnIndex);
        if (!this.getItemDisabled(cell)) {
          return this.getItemValue(cell);
        }
      }
      return this.firstValue;
    });
    __publicField(this, "getNextRowValue", (value, loop = false) => {
      const currentCell = this.getValueCell(value);
      if (currentCell === null) return null;
      const rows = this.getRows();
      const rowCount = rows.length;
      let nextRowIndex = currentCell.row;
      let nextColumnIndex = currentCell.column;
      for (let i = 1; i <= rowCount; i++) {
        nextRowIndex = nextIndex(rows, nextRowIndex, { loop });
        const nextRow = rows[nextRowIndex];
        if (!nextRow) continue;
        const nextCell = nextRow[nextColumnIndex];
        if (!nextCell) {
          const lastColumnIndex = this.getLastEnabledColumnIndex(nextRowIndex);
          if (lastColumnIndex != null) {
            nextColumnIndex = lastColumnIndex;
          }
        }
        const cell = this.getCell(nextRowIndex, nextColumnIndex);
        if (!this.getItemDisabled(cell)) {
          return this.getItemValue(cell);
        }
      }
      return this.lastValue;
    });
    this.columnCount = columnCount;
  }
};

// node_modules/.pnpm/@zag-js+collection@1.43.0/node_modules/@zag-js/collection/dist/selection.mjs
var Selection = class _Selection extends Set {
  constructor(values = []) {
    super(values);
    __publicField(this, "selectionMode", "single");
    __publicField(this, "deselectable", true);
    __publicField(this, "copy", () => {
      const clone = new _Selection([...this]);
      return this.sync(clone);
    });
    __publicField(this, "sync", (other) => {
      other.selectionMode = this.selectionMode;
      other.deselectable = this.deselectable;
      return other;
    });
    __publicField(this, "isEmpty", () => {
      return this.size === 0;
    });
    __publicField(this, "isSelected", (value) => {
      if (this.selectionMode === "none" || value == null) {
        return false;
      }
      return this.has(value);
    });
    __publicField(this, "canSelect", (collection, value) => {
      return this.selectionMode !== "none" || !collection.getItemDisabled(collection.find(value));
    });
    __publicField(this, "firstSelectedValue", (collection) => {
      let firstValue = null;
      for (let value of this) {
        if (!firstValue || collection.compareValue(value, firstValue) < 0) {
          firstValue = value;
        }
      }
      return firstValue;
    });
    __publicField(this, "lastSelectedValue", (collection) => {
      let lastValue = null;
      for (let value of this) {
        if (!lastValue || collection.compareValue(value, lastValue) > 0) {
          lastValue = value;
        }
      }
      return lastValue;
    });
    __publicField(this, "extendSelection", (collection, anchorValue, targetValue) => {
      if (this.selectionMode === "none") {
        return this;
      }
      if (this.selectionMode === "single") {
        return this.replaceSelection(collection, targetValue);
      }
      const selection = this.copy();
      const lastSelected = Array.from(this).pop();
      for (let key of collection.getValueRange(anchorValue, lastSelected ?? targetValue)) {
        selection.delete(key);
      }
      for (let key of collection.getValueRange(targetValue, anchorValue)) {
        if (this.canSelect(collection, key)) {
          selection.add(key);
        }
      }
      return selection;
    });
    __publicField(this, "toggleSelection", (collection, value) => {
      if (this.selectionMode === "none") {
        return this;
      }
      if (this.selectionMode === "single" && !this.isSelected(value)) {
        return this.replaceSelection(collection, value);
      }
      const selection = this.copy();
      if (selection.has(value)) {
        selection.delete(value);
      } else if (selection.canSelect(collection, value)) {
        selection.add(value);
      }
      return selection;
    });
    __publicField(this, "replaceSelection", (collection, value) => {
      if (this.selectionMode === "none") {
        return this;
      }
      if (value == null) {
        return this;
      }
      if (!this.canSelect(collection, value)) {
        return this;
      }
      const selection = new _Selection([value]);
      return this.sync(selection);
    });
    __publicField(this, "setSelection", (values2) => {
      if (this.selectionMode === "none") {
        return this;
      }
      let selection = new _Selection();
      for (let value of values2) {
        if (value != null) {
          selection.add(value);
          if (this.selectionMode === "single") {
            break;
          }
        }
      }
      return this.sync(selection);
    });
    __publicField(this, "clearSelection", () => {
      const selection = this.copy();
      if (selection.deselectable && selection.size > 0) {
        selection.clear();
      }
      return selection;
    });
    __publicField(this, "select", (collection, value, forceToggle) => {
      if (this.selectionMode === "none") {
        return this;
      }
      if (this.selectionMode === "single") {
        if (this.isSelected(value) && this.deselectable) {
          return this.toggleSelection(collection, value);
        } else {
          return this.replaceSelection(collection, value);
        }
      } else if (this.selectionMode === "multiple" || forceToggle) {
        return this.toggleSelection(collection, value);
      } else {
        return this.replaceSelection(collection, value);
      }
    });
    __publicField(this, "deselect", (value) => {
      const selection = this.copy();
      selection.delete(value);
      return selection;
    });
    __publicField(this, "isEqual", (other) => {
      return isEqual(Array.from(this), Array.from(other));
    });
  }
};

// node_modules/.pnpm/@zag-js+collection@1.43.0/node_modules/@zag-js/collection/dist/tree-visit.mjs
function access(node, indexPath, options) {
  for (let i = 0; i < indexPath.length; i++) node = options.getChildren(node, indexPath.slice(i + 1))[indexPath[i]];
  return node;
}
function ancestorIndexPaths(indexPaths) {
  const sortedPaths = sortIndexPaths(indexPaths);
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const indexPath of sortedPaths) {
    const key = indexPath.join();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(indexPath);
    }
  }
  return result;
}
function compareIndexPaths(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return a.length - b.length;
}
function sortIndexPaths(indexPaths) {
  return indexPaths.sort(compareIndexPaths);
}
function find(node, options) {
  let found;
  visit(node, {
    ...options,
    onEnter: (child, indexPath) => {
      if (options.predicate(child, indexPath)) {
        found = child;
        return "stop";
      }
    }
  });
  return found;
}
function findAll(node, options) {
  const found = [];
  visit(node, {
    onEnter: (child, indexPath) => {
      if (options.predicate(child, indexPath)) found.push(child);
    },
    getChildren: options.getChildren
  });
  return found;
}
function findIndexPath(node, options) {
  let found;
  visit(node, {
    onEnter: (child, indexPath) => {
      if (options.predicate(child, indexPath)) {
        found = [...indexPath];
        return "stop";
      }
    },
    getChildren: options.getChildren
  });
  return found;
}
function reduce(node, options) {
  let result = options.initialResult;
  visit(node, {
    ...options,
    onEnter: (child, indexPath) => {
      result = options.nextResult(result, child, indexPath);
    }
  });
  return result;
}
function flatMap(node, options) {
  return reduce(node, {
    ...options,
    initialResult: [],
    nextResult: (result, child, indexPath) => {
      result.push(...options.transform(child, indexPath));
      return result;
    }
  });
}
function filter(node, options) {
  const { predicate, create, getChildren } = options;
  const filterRecursive = (node2, indexPath) => {
    const children = getChildren(node2, indexPath);
    const filteredChildren = [];
    children.forEach((child, index) => {
      const childIndexPath = [...indexPath, index];
      const filteredChild = filterRecursive(child, childIndexPath);
      if (filteredChild) filteredChildren.push(filteredChild);
    });
    const isRoot = indexPath.length === 0;
    const nodeMatches = predicate(node2, indexPath);
    const hasFilteredChildren = filteredChildren.length > 0;
    if (isRoot || nodeMatches || hasFilteredChildren) {
      return create(node2, filteredChildren, indexPath);
    }
    return null;
  };
  return filterRecursive(node, []) || create(node, [], []);
}
function flatten(rootNode, options) {
  const nodes = [];
  let idx = 0;
  const idxMap = /* @__PURE__ */ new Map();
  const parentMap = /* @__PURE__ */ new Map();
  visit(rootNode, {
    getChildren: options.getChildren,
    onEnter: (node, indexPath) => {
      if (!idxMap.has(node)) {
        idxMap.set(node, idx++);
      }
      const children = options.getChildren(node, indexPath);
      children.forEach((child) => {
        if (!parentMap.has(child)) {
          parentMap.set(child, node);
        }
        if (!idxMap.has(child)) {
          idxMap.set(child, idx++);
        }
      });
      const _children = children.length > 0 ? children.map((child) => idxMap.get(child)) : void 0;
      const parent = parentMap.get(node);
      const _parent = parent ? idxMap.get(parent) : void 0;
      const _index = idxMap.get(node);
      nodes.push({ ...node, _children, _parent, _index });
    }
  });
  return nodes;
}
function insertOperation(index, nodes) {
  return { type: "insert", index, nodes };
}
function removeOperation(indexes) {
  return { type: "remove", indexes };
}
function replaceOperation() {
  return { type: "replace" };
}
function splitIndexPath(indexPath) {
  return [indexPath.slice(0, -1), indexPath[indexPath.length - 1]];
}
function getInsertionOperations(indexPath, nodes, operations = /* @__PURE__ */ new Map()) {
  const [parentIndexPath, index] = splitIndexPath(indexPath);
  for (let i = parentIndexPath.length - 1; i >= 0; i--) {
    const parentKey = parentIndexPath.slice(0, i).join();
    switch (operations.get(parentKey)?.type) {
      case "remove":
        continue;
    }
    operations.set(parentKey, replaceOperation());
  }
  const operation = operations.get(parentIndexPath.join());
  switch (operation?.type) {
    case "remove":
      operations.set(parentIndexPath.join(), {
        type: "removeThenInsert",
        removeIndexes: operation.indexes,
        insertIndex: index,
        insertNodes: nodes
      });
      break;
    default:
      operations.set(parentIndexPath.join(), insertOperation(index, nodes));
  }
  return operations;
}
function getRemovalOperations(indexPaths) {
  const operations = /* @__PURE__ */ new Map();
  const indexesToRemove = /* @__PURE__ */ new Map();
  for (const indexPath of indexPaths) {
    const parentKey = indexPath.slice(0, -1).join();
    const value = indexesToRemove.get(parentKey) ?? [];
    value.push(indexPath[indexPath.length - 1]);
    indexesToRemove.set(
      parentKey,
      value.sort((a, b) => a - b)
    );
  }
  for (const indexPath of indexPaths) {
    for (let i = indexPath.length - 2; i >= 0; i--) {
      const parentKey = indexPath.slice(0, i).join();
      if (!operations.has(parentKey)) {
        operations.set(parentKey, replaceOperation());
      }
    }
  }
  for (const [parentKey, indexes] of indexesToRemove) {
    operations.set(parentKey, removeOperation(indexes));
  }
  return operations;
}
function getReplaceOperations(indexPath, node) {
  const operations = /* @__PURE__ */ new Map();
  const [parentIndexPath, index] = splitIndexPath(indexPath);
  for (let i = parentIndexPath.length - 1; i >= 0; i--) {
    const parentKey = parentIndexPath.slice(0, i).join();
    operations.set(parentKey, replaceOperation());
  }
  operations.set(parentIndexPath.join(), {
    type: "removeThenInsert",
    removeIndexes: [index],
    insertIndex: index,
    insertNodes: [node]
  });
  return operations;
}
function mutate(node, operations, options) {
  return map(node, {
    ...options,
    getChildren: (node2, indexPath) => {
      const key = indexPath.join();
      const operation = operations.get(key);
      switch (operation?.type) {
        case "replace":
        case "remove":
        case "removeThenInsert":
        case "insert":
          return options.getChildren(node2, indexPath);
        default:
          return [];
      }
    },
    transform: (node2, children, indexPath) => {
      const key = indexPath.join();
      const operation = operations.get(key);
      switch (operation?.type) {
        case "remove":
          return options.create(
            node2,
            children.filter((_, index) => !operation.indexes.includes(index)),
            indexPath
          );
        case "removeThenInsert":
          const updatedChildren = children.filter((_, index) => !operation.removeIndexes.includes(index));
          const adjustedIndex = operation.removeIndexes.reduce(
            (index, removedIndex) => removedIndex < index ? index - 1 : index,
            operation.insertIndex
          );
          return options.create(node2, splice(updatedChildren, adjustedIndex, 0, ...operation.insertNodes), indexPath);
        case "insert":
          return options.create(node2, splice(children, operation.index, 0, ...operation.nodes), indexPath);
        case "replace":
          return options.create(node2, children, indexPath);
        default:
          return node2;
      }
    }
  });
}
function splice(array, start, deleteCount, ...items) {
  return [...array.slice(0, start), ...items, ...array.slice(start + deleteCount)];
}
function map(node, options) {
  const childrenMap = {};
  visit(node, {
    ...options,
    onLeave: (child, indexPath) => {
      const keyIndexPath = [0, ...indexPath];
      const key = keyIndexPath.join();
      const transformed = options.transform(child, childrenMap[key] ?? [], indexPath);
      const parentKey = keyIndexPath.slice(0, -1).join();
      const parentChildren = childrenMap[parentKey] ?? [];
      parentChildren.push(transformed);
      childrenMap[parentKey] = parentChildren;
    }
  });
  return childrenMap[""][0];
}
function insert2(node, options) {
  const { nodes, at } = options;
  if (at.length === 0) throw new Error(`Can't insert nodes at the root`);
  const state = getInsertionOperations(at, nodes);
  return mutate(node, state, options);
}
function replace(node, options) {
  if (options.at.length === 0) return options.node;
  const operations = getReplaceOperations(options.at, options.node);
  return mutate(node, operations, options);
}
function remove(node, options) {
  if (options.indexPaths.length === 0) return node;
  for (const indexPath of options.indexPaths) {
    if (indexPath.length === 0) throw new Error(`Can't remove the root node`);
  }
  const operations = getRemovalOperations(options.indexPaths);
  return mutate(node, operations, options);
}
function move2(node, options) {
  if (options.indexPaths.length === 0) return node;
  for (const indexPath of options.indexPaths) {
    if (indexPath.length === 0) throw new Error(`Can't move the root node`);
  }
  if (options.to.length === 0) throw new Error(`Can't move nodes to the root`);
  const _ancestorIndexPaths = ancestorIndexPaths(options.indexPaths);
  const nodesToInsert = _ancestorIndexPaths.map((indexPath) => access(node, indexPath, options));
  const operations = getInsertionOperations(options.to, nodesToInsert, getRemovalOperations(_ancestorIndexPaths));
  return mutate(node, operations, options);
}
function visit(node, options) {
  const { onEnter, onLeave, getChildren } = options;
  let indexPath = [];
  let stack = [{ node }];
  const getIndexPath = options.reuseIndexPath ? () => indexPath : () => indexPath.slice();
  while (stack.length > 0) {
    let wrapper = stack[stack.length - 1];
    if (wrapper.state === void 0) {
      const enterResult = onEnter?.(wrapper.node, getIndexPath());
      if (enterResult === "stop") return;
      wrapper.state = enterResult === "skip" ? -1 : 0;
    }
    const children = wrapper.children || getChildren(wrapper.node, getIndexPath());
    wrapper.children || (wrapper.children = children);
    if (wrapper.state !== -1) {
      if (wrapper.state < children.length) {
        let currentIndex = wrapper.state;
        indexPath.push(currentIndex);
        stack.push({ node: children[currentIndex] });
        wrapper.state = currentIndex + 1;
        continue;
      }
      const leaveResult = onLeave?.(wrapper.node, getIndexPath());
      if (leaveResult === "stop") return;
    }
    indexPath.pop();
    stack.pop();
  }
}

// node_modules/.pnpm/@zag-js+collection@1.43.0/node_modules/@zag-js/collection/dist/tree-collection.mjs
var TreeCollection = class _TreeCollection {
  constructor(options) {
    __publicField(this, "options", options);
    __publicField(this, "rootNode");
    __publicField(this, "isEqual", (other) => {
      return isEqual(this.rootNode, other.rootNode);
    });
    __publicField(this, "getNodeChildren", (node) => {
      return this.options.nodeToChildren?.(node) ?? fallbackMethods.nodeToChildren(node) ?? [];
    });
    __publicField(this, "resolveIndexPath", (valueOrIndexPath) => {
      return typeof valueOrIndexPath === "string" ? this.getIndexPath(valueOrIndexPath) : valueOrIndexPath;
    });
    __publicField(this, "resolveNode", (valueOrIndexPath) => {
      const indexPath = this.resolveIndexPath(valueOrIndexPath);
      return indexPath ? this.at(indexPath) : void 0;
    });
    __publicField(this, "getNodeChildrenCount", (node) => {
      return this.options.nodeToChildrenCount?.(node) ?? fallbackMethods.nodeToChildrenCount(node);
    });
    __publicField(this, "getNodeValue", (node) => {
      return this.options.nodeToValue?.(node) ?? fallbackMethods.nodeToValue(node);
    });
    __publicField(this, "getNodeDisabled", (node) => {
      return this.options.isNodeDisabled?.(node) ?? fallbackMethods.isNodeDisabled(node);
    });
    __publicField(this, "stringify", (value) => {
      const node = this.findNode(value);
      if (!node) return null;
      return this.stringifyNode(node);
    });
    __publicField(this, "stringifyNode", (node) => {
      return this.options.nodeToString?.(node) ?? fallbackMethods.nodeToString(node);
    });
    __publicField(this, "getFirstNode", (rootNode = this.rootNode, opts = {}) => {
      let firstChild;
      visit(rootNode, {
        getChildren: this.getNodeChildren,
        onEnter: (node, indexPath) => {
          if (this.isSameNode(node, rootNode)) return;
          if (opts.skip?.({ value: this.getNodeValue(node), node, indexPath })) return "skip";
          if (!firstChild && indexPath.length > 0 && !this.getNodeDisabled(node)) {
            firstChild = node;
            return "stop";
          }
        }
      });
      return firstChild;
    });
    __publicField(this, "getLastNode", (rootNode = this.rootNode, opts = {}) => {
      let lastChild;
      visit(rootNode, {
        getChildren: this.getNodeChildren,
        onEnter: (node, indexPath) => {
          if (this.isSameNode(node, rootNode)) return;
          if (opts.skip?.({ value: this.getNodeValue(node), node, indexPath })) return "skip";
          if (indexPath.length > 0 && !this.getNodeDisabled(node)) {
            lastChild = node;
          }
        }
      });
      return lastChild;
    });
    __publicField(this, "at", (indexPath) => {
      return access(this.rootNode, indexPath, {
        getChildren: this.getNodeChildren
      });
    });
    __publicField(this, "findNode", (value, rootNode = this.rootNode) => {
      return find(rootNode, {
        getChildren: this.getNodeChildren,
        predicate: (node) => this.getNodeValue(node) === value
      });
    });
    __publicField(this, "findNodes", (values, rootNode = this.rootNode) => {
      const v = new Set(values.filter((v2) => v2 != null));
      return findAll(rootNode, {
        getChildren: this.getNodeChildren,
        predicate: (node) => v.has(this.getNodeValue(node))
      });
    });
    __publicField(this, "sort", (values) => {
      return values.reduce((acc, value) => {
        const indexPath = this.getIndexPath(value);
        if (indexPath) acc.push({ value, indexPath });
        return acc;
      }, []).sort((a, b) => compareIndexPaths(a.indexPath, b.indexPath)).map(({ value }) => value);
    });
    __publicField(this, "getValue", (indexPath) => {
      const node = this.at(indexPath);
      return node ? this.getNodeValue(node) : void 0;
    });
    __publicField(this, "getValuePath", (indexPath) => {
      if (!indexPath) return [];
      const valuePath = [];
      let currentPath = [...indexPath];
      while (currentPath.length > 0) {
        const node = this.at(currentPath);
        if (node) valuePath.unshift(this.getNodeValue(node));
        currentPath.pop();
      }
      return valuePath;
    });
    __publicField(this, "getDepth", (value) => {
      const indexPath = findIndexPath(this.rootNode, {
        getChildren: this.getNodeChildren,
        predicate: (node) => this.getNodeValue(node) === value
      });
      return indexPath?.length ?? 0;
    });
    __publicField(this, "isSameNode", (node, other) => {
      return this.getNodeValue(node) === this.getNodeValue(other);
    });
    __publicField(this, "isRootNode", (node) => {
      return this.isSameNode(node, this.rootNode);
    });
    __publicField(this, "contains", (parentIndexPath, valueIndexPath) => {
      if (!parentIndexPath || !valueIndexPath) return false;
      return valueIndexPath.slice(0, parentIndexPath.length).every((_, i) => parentIndexPath[i] === valueIndexPath[i]);
    });
    __publicField(this, "getNextNode", (value, opts = {}) => {
      let found = false;
      let nextNode;
      visit(this.rootNode, {
        getChildren: this.getNodeChildren,
        onEnter: (node, indexPath) => {
          if (this.isRootNode(node)) return;
          const nodeValue = this.getNodeValue(node);
          if (opts.skip?.({ value: nodeValue, node, indexPath })) {
            if (nodeValue === value) {
              found = true;
            }
            return "skip";
          }
          if (found && !this.getNodeDisabled(node)) {
            nextNode = node;
            return "stop";
          }
          if (nodeValue === value) {
            found = true;
          }
        }
      });
      return nextNode;
    });
    __publicField(this, "getPreviousNode", (value, opts = {}) => {
      let previousNode;
      let found = false;
      visit(this.rootNode, {
        getChildren: this.getNodeChildren,
        onEnter: (node, indexPath) => {
          if (this.isRootNode(node)) return;
          const nodeValue = this.getNodeValue(node);
          if (opts.skip?.({ value: nodeValue, node, indexPath })) {
            return "skip";
          }
          if (nodeValue === value) {
            found = true;
            return "stop";
          }
          if (!this.getNodeDisabled(node)) {
            previousNode = node;
          }
        }
      });
      return found ? previousNode : void 0;
    });
    __publicField(this, "getParentNodes", (valueOrIndexPath) => {
      const indexPath = this.resolveIndexPath(valueOrIndexPath)?.slice();
      if (!indexPath) return [];
      const result = [];
      while (indexPath.length > 0) {
        indexPath.pop();
        const parentNode = this.at(indexPath);
        if (parentNode && !this.isRootNode(parentNode)) {
          result.unshift(parentNode);
        }
      }
      return result;
    });
    __publicField(this, "getDescendantNodes", (valueOrIndexPath, options2) => {
      const parentNode = this.resolveNode(valueOrIndexPath);
      if (!parentNode) return [];
      const result = [];
      visit(parentNode, {
        getChildren: this.getNodeChildren,
        onEnter: (node, nodeIndexPath) => {
          if (nodeIndexPath.length === 0) return;
          if (!options2?.withBranch && this.isBranchNode(node)) return;
          result.push(node);
        }
      });
      return result;
    });
    __publicField(this, "getDescendantValues", (valueOrIndexPath, options2) => {
      const children = this.getDescendantNodes(valueOrIndexPath, options2);
      return children.map((child) => this.getNodeValue(child));
    });
    __publicField(this, "getParentIndexPath", (indexPath) => {
      return indexPath.slice(0, -1);
    });
    __publicField(this, "getParentNode", (valueOrIndexPath) => {
      const indexPath = this.resolveIndexPath(valueOrIndexPath);
      return indexPath ? this.at(this.getParentIndexPath(indexPath)) : void 0;
    });
    __publicField(this, "visit", (opts) => {
      const { skip, ...rest } = opts;
      visit(this.rootNode, {
        ...rest,
        getChildren: this.getNodeChildren,
        onEnter: (node, indexPath) => {
          if (this.isRootNode(node)) return;
          if (skip?.({ value: this.getNodeValue(node), node, indexPath })) return "skip";
          return rest.onEnter?.(node, indexPath);
        }
      });
    });
    __publicField(this, "getPreviousSibling", (indexPath) => {
      const parentNode = this.getParentNode(indexPath);
      if (!parentNode) return;
      const siblings = this.getNodeChildren(parentNode);
      let idx = indexPath[indexPath.length - 1];
      while (--idx >= 0) {
        const sibling = siblings[idx];
        if (!this.getNodeDisabled(sibling)) return sibling;
      }
      return;
    });
    __publicField(this, "getNextSibling", (indexPath) => {
      const parentNode = this.getParentNode(indexPath);
      if (!parentNode) return;
      const siblings = this.getNodeChildren(parentNode);
      let idx = indexPath[indexPath.length - 1];
      while (++idx < siblings.length) {
        const sibling = siblings[idx];
        if (!this.getNodeDisabled(sibling)) return sibling;
      }
      return;
    });
    __publicField(this, "getSiblingNodes", (indexPath) => {
      const parentNode = this.getParentNode(indexPath);
      return parentNode ? this.getNodeChildren(parentNode) : [];
    });
    __publicField(this, "getValues", (rootNode = this.rootNode) => {
      const values = flatMap(rootNode, {
        getChildren: this.getNodeChildren,
        transform: (node) => [this.getNodeValue(node)]
      });
      return values.slice(1);
    });
    __publicField(this, "isValidDepth", (indexPath, depth) => {
      if (depth == null) return true;
      if (typeof depth === "function") return depth(indexPath.length);
      return indexPath.length === depth;
    });
    __publicField(this, "isBranchNode", (node) => {
      return this.getNodeChildren(node).length > 0 || this.getNodeChildrenCount(node) != null;
    });
    __publicField(this, "getBranchValues", (rootNode = this.rootNode, opts = {}) => {
      let values = [];
      visit(rootNode, {
        getChildren: this.getNodeChildren,
        onEnter: (node, indexPath) => {
          if (indexPath.length === 0) return;
          const nodeValue = this.getNodeValue(node);
          if (opts.skip?.({ value: nodeValue, node, indexPath })) return "skip";
          if (this.isBranchNode(node) && this.isValidDepth(indexPath, opts.depth)) {
            values.push(this.getNodeValue(node));
          }
        }
      });
      return values;
    });
    __publicField(this, "flatten", (rootNode = this.rootNode) => {
      return flatten(rootNode, { getChildren: this.getNodeChildren });
    });
    __publicField(this, "_create", (node, children) => {
      if (this.getNodeChildren(node).length > 0 || children.length > 0) {
        return { ...node, children };
      }
      return { ...node };
    });
    __publicField(this, "_insert", (rootNode, indexPath, nodes) => {
      return this.copy(
        insert2(rootNode, { at: indexPath, nodes, getChildren: this.getNodeChildren, create: this._create })
      );
    });
    __publicField(this, "copy", (rootNode) => {
      return new _TreeCollection({ ...this.options, rootNode });
    });
    __publicField(this, "_replace", (rootNode, indexPath, node) => {
      return this.copy(
        replace(rootNode, { at: indexPath, node, getChildren: this.getNodeChildren, create: this._create })
      );
    });
    __publicField(this, "_move", (rootNode, indexPaths, to) => {
      return this.copy(move2(rootNode, { indexPaths, to, getChildren: this.getNodeChildren, create: this._create }));
    });
    __publicField(this, "_remove", (rootNode, indexPaths) => {
      return this.copy(remove(rootNode, { indexPaths, getChildren: this.getNodeChildren, create: this._create }));
    });
    __publicField(this, "replace", (indexPath, node) => {
      return this._replace(this.rootNode, indexPath, node);
    });
    __publicField(this, "remove", (indexPaths) => {
      return this._remove(this.rootNode, indexPaths);
    });
    __publicField(this, "insertBefore", (indexPath, nodes) => {
      const parentNode = this.getParentNode(indexPath);
      return parentNode ? this._insert(this.rootNode, indexPath, nodes) : void 0;
    });
    __publicField(this, "insertAfter", (indexPath, nodes) => {
      const parentNode = this.getParentNode(indexPath);
      if (!parentNode) return;
      const nextIndex2 = [...indexPath.slice(0, -1), indexPath[indexPath.length - 1] + 1];
      return this._insert(this.rootNode, nextIndex2, nodes);
    });
    __publicField(this, "move", (fromIndexPaths, toIndexPath) => {
      return this._move(this.rootNode, fromIndexPaths, toIndexPath);
    });
    __publicField(this, "filter", (predicate) => {
      const filteredRoot = filter(this.rootNode, {
        predicate,
        getChildren: this.getNodeChildren,
        create: this._create
      });
      return this.copy(filteredRoot);
    });
    __publicField(this, "toJSON", () => {
      return this.getValues(this.rootNode);
    });
    this.rootNode = options.rootNode;
  }
  getIndexPath(valueOrValuePath) {
    if (Array.isArray(valueOrValuePath)) {
      if (valueOrValuePath.length === 0) return [];
      const indexPath = [];
      let currentChildren = this.getNodeChildren(this.rootNode);
      for (let i = 0; i < valueOrValuePath.length; i++) {
        const currentValue = valueOrValuePath[i];
        const matchingChildIndex = currentChildren.findIndex((child) => this.getNodeValue(child) === currentValue);
        if (matchingChildIndex === -1) break;
        indexPath.push(matchingChildIndex);
        if (i < valueOrValuePath.length - 1) {
          const currentNode = currentChildren[matchingChildIndex];
          currentChildren = this.getNodeChildren(currentNode);
        }
      }
      return indexPath;
    } else {
      return findIndexPath(this.rootNode, {
        getChildren: this.getNodeChildren,
        predicate: (node) => this.getNodeValue(node) === valueOrValuePath
      });
    }
  }
};
function filePathToTree(paths) {
  const rootNode = {
    label: "",
    value: "ROOT",
    children: []
  };
  paths.forEach((path) => {
    const parts = path.split("/");
    let currentNode = rootNode;
    parts.forEach((part, index) => {
      let childNode = currentNode.children?.find((child) => child.label === part);
      if (!childNode) {
        childNode = {
          value: parts.slice(0, index + 1).join("/"),
          label: part
        };
        currentNode.children || (currentNode.children = []);
        currentNode.children.push(childNode);
      }
      currentNode = childNode;
    });
  });
  return new TreeCollection({ rootNode });
}
var fallbackMethods = {
  nodeToValue(node) {
    if (typeof node === "string") return node;
    if (isObject(node) && hasProp(node, "value")) return node.value;
    return "";
  },
  nodeToString(node) {
    if (typeof node === "string") return node;
    if (isObject(node) && hasProp(node, "label")) return node.label;
    return fallbackMethods.nodeToValue(node);
  },
  isNodeDisabled(node) {
    if (isObject(node) && hasProp(node, "disabled")) return !!node.disabled;
    return false;
  },
  nodeToChildren(node) {
    return node.children;
  },
  nodeToChildrenCount(node) {
    if (isObject(node) && hasProp(node, "childrenCount")) return node.childrenCount;
  }
};

// node_modules/.pnpm/@ark-ui+react@5.38.1_react-dom@19.2.8_react@19.2.8/node_modules/@ark-ui/react/dist/components/collection/grid-collection.js
var createGridCollection = (options) => new GridCollection(options);

// node_modules/.pnpm/@ark-ui+react@5.38.1_react-dom@19.2.8_react@19.2.8/node_modules/@ark-ui/react/dist/components/collection/list-collection.js
var createListCollection = (options) => new ListCollection(options);

// node_modules/.pnpm/@ark-ui+react@5.38.1_react-dom@19.2.8_react@19.2.8/node_modules/@ark-ui/react/dist/components/collection/tree-collection.js
var createTreeCollection = (options) => new TreeCollection(options);
var createFileTreeCollection = (paths) => filePathToTree(paths);

// node_modules/.pnpm/@zag-js+core@1.43.0/node_modules/@zag-js/core/dist/state.mjs
var STATE_DELIMITER = ".";
var ABSOLUTE_PREFIX = "#";
var stateIndexCache = /* @__PURE__ */ new WeakMap();
var stateIdIndexCache = /* @__PURE__ */ new WeakMap();
function joinStatePath(parts) {
  return parts.join(STATE_DELIMITER);
}
function isAbsoluteStatePath(value) {
  return value.includes(STATE_DELIMITER);
}
function isExplicitAbsoluteStatePath(value) {
  return value.startsWith(ABSOLUTE_PREFIX);
}
function isChildTarget(value) {
  return value.startsWith(STATE_DELIMITER);
}
function stripAbsolutePrefix(value) {
  return isExplicitAbsoluteStatePath(value) ? value.slice(ABSOLUTE_PREFIX.length) : value;
}
function appendStatePath(base, segment) {
  return base ? `${base}${STATE_DELIMITER}${segment}` : segment;
}
function buildStateIndex(machine2) {
  const index = /* @__PURE__ */ new Map();
  const idIndex = /* @__PURE__ */ new Map();
  const visit2 = (basePath, state) => {
    index.set(basePath, state);
    const stateId = state.id;
    if (stateId) {
      if (idIndex.has(stateId)) {
        invariant(`[zag-js] Duplicate state id: "${stateId}"`);
      }
      idIndex.set(stateId, basePath);
    }
    const childStates = state.states;
    if (!childStates) return;
    ensure(state.initial, () => `[zag-js] Compound state "${basePath}" has child states but no "initial" property`);
    if (!(state.initial in childStates)) {
      invariant(
        `[zag-js] Compound state "${basePath}" has initial "${String(state.initial)}" which is not a child state`
      );
    }
    for (const [childKey, childState] of Object.entries(childStates)) {
      if (!childState) continue;
      const childPath = appendStatePath(basePath, childKey);
      visit2(childPath, childState);
    }
  };
  for (const [topKey, topState] of Object.entries(machine2.states)) {
    if (!topState) continue;
    visit2(topKey, topState);
  }
  return { index, idIndex };
}
function ensureStateIndex(machine2) {
  const cached = stateIndexCache.get(machine2);
  if (cached) return cached;
  const { index, idIndex } = buildStateIndex(machine2);
  stateIndexCache.set(machine2, index);
  stateIdIndexCache.set(machine2, idIndex);
  return index;
}
function getStatePathById(machine2, stateId) {
  ensureStateIndex(machine2);
  return stateIdIndexCache.get(machine2)?.get(stateId);
}
function toSegments(value) {
  if (!value) return [];
  return String(value).split(STATE_DELIMITER).filter(Boolean);
}
function getStateChain(machine2, state) {
  if (!state) return [];
  const stateIndex = ensureStateIndex(machine2);
  const segments = toSegments(state);
  const chain = [];
  const statePath = [];
  for (const segment of segments) {
    statePath.push(segment);
    const path = joinStatePath(statePath);
    const current = stateIndex.get(path);
    if (!current) break;
    chain.push({ path, state: current });
  }
  return chain;
}
function resolveAbsoluteStateValue(machine2, value) {
  const stateIndex = ensureStateIndex(machine2);
  const segments = toSegments(value);
  if (!segments.length) return value;
  const resolved = [];
  for (const segment of segments) {
    resolved.push(segment);
    const path = joinStatePath(resolved);
    if (!stateIndex.has(path)) return value;
  }
  let resolvedPath = joinStatePath(resolved);
  let current = stateIndex.get(resolvedPath);
  while (current?.initial) {
    const nextPath = `${resolvedPath}${STATE_DELIMITER}${current.initial}`;
    const nextState = stateIndex.get(nextPath);
    if (!nextState) break;
    resolvedPath = nextPath;
    current = nextState;
  }
  return resolvedPath;
}
function hasStatePath(machine2, value) {
  const stateIndex = ensureStateIndex(machine2);
  return stateIndex.has(value);
}
function resolveStateValue(machine2, value, source) {
  const stateValue = String(value);
  if (isExplicitAbsoluteStatePath(stateValue)) {
    const stateId = stripAbsolutePrefix(stateValue);
    const statePath = getStatePathById(machine2, stateId);
    ensure(statePath, () => `[zag-js] Unknown state id: "${stateId}"`);
    return resolveAbsoluteStateValue(machine2, statePath);
  }
  if (isChildTarget(stateValue) && source) {
    const childPath = appendStatePath(source, stateValue.slice(1));
    return resolveAbsoluteStateValue(machine2, childPath);
  }
  if (!isAbsoluteStatePath(stateValue) && source) {
    const sourceSegments = toSegments(source);
    for (let index = sourceSegments.length - 1; index >= 1; index--) {
      const base = sourceSegments.slice(0, index).join(STATE_DELIMITER);
      const candidate = appendStatePath(base, stateValue);
      if (hasStatePath(machine2, candidate)) return resolveAbsoluteStateValue(machine2, candidate);
    }
    if (hasStatePath(machine2, stateValue)) return resolveAbsoluteStateValue(machine2, stateValue);
  }
  return resolveAbsoluteStateValue(machine2, stateValue);
}
function findTransition(machine2, state, eventType) {
  const chain = getStateChain(machine2, state);
  for (let index = chain.length - 1; index >= 0; index--) {
    const transitionMap = chain[index]?.state.on;
    const transition = transitionMap?.[eventType];
    if (transition) return { transitions: transition, source: chain[index]?.path };
  }
  const rootTransitionMap = machine2.on;
  return { transitions: rootTransitionMap?.[eventType], source: void 0 };
}
function getExitEnterStates(machine2, prevState, nextState, reenter) {
  const prevChain = prevState ? getStateChain(machine2, prevState) : [];
  const nextChain = getStateChain(machine2, nextState);
  let commonIndex = 0;
  while (commonIndex < prevChain.length && commonIndex < nextChain.length && prevChain[commonIndex]?.path === nextChain[commonIndex]?.path) {
    commonIndex += 1;
  }
  let exiting = prevChain.slice(commonIndex).reverse();
  let entering = nextChain.slice(commonIndex);
  const sameLeaf = prevChain.at(-1)?.path === nextChain.at(-1)?.path;
  if (reenter && sameLeaf) {
    exiting = prevChain.slice().reverse();
    entering = nextChain;
  }
  return { exiting, entering };
}
function matchesState(current, value) {
  if (!current) return false;
  return current === value || current.startsWith(`${value}${STATE_DELIMITER}`);
}
function hasTag(machine2, state, tag) {
  return getStateChain(machine2, state).some((item) => item.state.tags?.includes(tag));
}

// node_modules/.pnpm/@zag-js+core@1.43.0/node_modules/@zag-js/core/dist/create-machine.mjs
function createMachine(config) {
  ensureStateIndex(config);
  return config;
}

// node_modules/.pnpm/@zag-js+core@1.43.0/node_modules/@zag-js/core/dist/types.mjs
var MachineStatus = ((MachineStatus2) => {
  MachineStatus2["NotStarted"] = "Not Started";
  MachineStatus2["Started"] = "Started";
  MachineStatus2["Stopped"] = "Stopped";
  return MachineStatus2;
})(MachineStatus || {});
var INIT_STATE = "__init__";

// node_modules/.pnpm/@zag-js+dom-query@1.43.0/node_modules/@zag-js/dom-query/dist/shared.mjs
var wrap = (v, idx) => {
  return v.map((_, index) => v[(Math.max(idx, 0) + index) % v.length]);
};
var isObject2 = (v) => typeof v === "object" && v !== null;

// node_modules/.pnpm/@zag-js+dom-query@1.43.0/node_modules/@zag-js/dom-query/dist/node.mjs
var ELEMENT_NODE = 1;
var DOCUMENT_NODE = 9;
var DOCUMENT_FRAGMENT_NODE = 11;
var isHTMLElement = (el) => isObject2(el) && el.nodeType === ELEMENT_NODE && typeof el.nodeName === "string";
var isDocument = (el) => isObject2(el) && el.nodeType === DOCUMENT_NODE;
var isWindow = (el) => isObject2(el) && el === el.window;
var isNode = (el) => isObject2(el) && el.nodeType !== void 0;
var isShadowRoot = (el) => isNode(el) && el.nodeType === DOCUMENT_FRAGMENT_NODE && "host" in el;
function isActiveElement(element) {
  if (!element) return false;
  const rootNode = element.getRootNode();
  return getActiveElement(rootNode) === element;
}
function getDocument(el) {
  if (isDocument(el)) return el;
  if (isWindow(el)) return el.document;
  return el?.ownerDocument ?? document;
}
function getWindow(el) {
  if (isShadowRoot(el)) return getWindow(el.host);
  if (isDocument(el)) return el.defaultView ?? window;
  if (isHTMLElement(el)) return el.ownerDocument?.defaultView ?? window;
  return window;
}
function getActiveElement(rootNode) {
  let activeElement = rootNode.activeElement;
  while (activeElement?.shadowRoot) {
    const el = activeElement.shadowRoot.activeElement;
    if (!el || el === activeElement) break;
    else activeElement = el;
  }
  return activeElement;
}

// node_modules/.pnpm/@zag-js+dom-query@1.43.0/node_modules/@zag-js/dom-query/dist/query.mjs
var defaultItemToId = (v) => v.id;
function itemById(v, id, itemToId = defaultItemToId) {
  return v.find((item) => itemToId(item) === id);
}
function indexOfId(v, id, itemToId = defaultItemToId) {
  const item = itemById(v, id, itemToId);
  return item ? v.indexOf(item) : -1;
}

// node_modules/.pnpm/@zag-js+dom-query@1.43.0/node_modules/@zag-js/dom-query/dist/resize-observer.mjs
function createSharedResizeObserver(options) {
  const listeners = /* @__PURE__ */ new WeakMap();
  let observer;
  const entries = /* @__PURE__ */ new WeakMap();
  const getObserver = (win) => {
    if (observer) return observer;
    observer = new win.ResizeObserver((observedEntries) => {
      for (const entry of observedEntries) {
        entries.set(entry.target, entry);
        const elementListeners = listeners.get(entry.target);
        if (elementListeners) {
          for (const listener of elementListeners) {
            listener(entry);
          }
        }
      }
    });
    return observer;
  };
  const observe = (element, listener) => {
    let elementListeners = listeners.get(element) || /* @__PURE__ */ new Set();
    elementListeners.add(listener);
    listeners.set(element, elementListeners);
    const win = getWindow(element);
    getObserver(win).observe(element, options);
    return () => {
      const elementListeners2 = listeners.get(element);
      if (!elementListeners2) return;
      elementListeners2.delete(listener);
      if (elementListeners2.size === 0) {
        listeners.delete(element);
        getObserver(win).unobserve(element);
      }
    };
  };
  const unobserve = (element) => {
    listeners.delete(element);
    observer?.unobserve(element);
  };
  return {
    observe,
    unobserve
  };
}
var resizeObserverContentBox = createSharedResizeObserver({
  box: "content-box"
});
var resizeObserverBorderBox = createSharedResizeObserver({
  box: "border-box"
});
var resizeObserverDevicePixelContentBox = createSharedResizeObserver({
  box: "device-pixel-content-box"
});

// node_modules/.pnpm/@zag-js+dom-query@1.43.0/node_modules/@zag-js/dom-query/dist/searchable.mjs
var sanitize = (str) => str.split("").map((char) => {
  const code = char.charCodeAt(0);
  if (code > 0 && code < 128) return char;
  if (code >= 128 && code <= 255) return `/x${code.toString(16)}`.replace("/", "\\");
  return "";
}).join("").trim();
var getValueText = (el) => {
  return sanitize(el.dataset?.valuetext ?? el.textContent ?? "");
};
var match2 = (valueText, query) => {
  return valueText.trim().toLowerCase().startsWith(query.toLowerCase());
};
function getByText(v, text, currentId, itemToId = defaultItemToId) {
  const index = currentId ? indexOfId(v, currentId, itemToId) : -1;
  let items = currentId ? wrap(v, index) : v;
  const isSingleKey = text.length === 1;
  if (isSingleKey) {
    items = items.filter((item) => itemToId(item) !== currentId);
  }
  return items.find((item) => match2(getValueText(item), text));
}

// node_modules/.pnpm/@zag-js+dom-query@1.43.0/node_modules/@zag-js/dom-query/dist/typeahead.mjs
function getByTypeaheadImpl(baseItems, options) {
  const { state, activeId, key, timeout = 350, itemToId } = options;
  const search = state.keysSoFar + key;
  const isRepeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
  const query = isRepeated ? search[0] : search;
  let items = baseItems.slice();
  const next = getByText(items, query, activeId, itemToId);
  function cleanup() {
    clearTimeout(state.timer);
    state.timer = -1;
  }
  function update(value) {
    state.keysSoFar = value;
    cleanup();
    if (value !== "") {
      state.timer = +setTimeout(() => {
        update("");
        cleanup();
      }, timeout);
    }
  }
  update(search);
  return next;
}
var getByTypeahead = Object.assign(getByTypeaheadImpl, {
  defaultOptions: { keysSoFar: "", timer: -1 },
  isValidEvent: isValidTypeaheadEvent
});
function isValidTypeaheadEvent(event) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey;
}

// node_modules/.pnpm/@zag-js+core@1.43.0/node_modules/@zag-js/core/dist/scope.mjs
function createScope(props) {
  const getRootNode2 = () => props.getRootNode?.() ?? document;
  const getDoc = () => getDocument(getRootNode2());
  const getWin = () => getDoc().defaultView ?? window;
  const getActiveElementFn = () => getActiveElement(getRootNode2());
  const getById = (id) => getRootNode2().getElementById(id);
  return {
    ...props,
    getRootNode: getRootNode2,
    getDoc,
    getWin,
    getActiveElement: getActiveElementFn,
    isActiveElement,
    getById
  };
}

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/index.mjs
var import_react7 = __toESM(require_react(), 1);

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/machine.mjs
var import_react6 = __toESM(require_react(), 1);
var import_react_dom2 = __toESM(require_react_dom(), 1);

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/bindable.mjs
var import_react2 = __toESM(require_react(), 1);
var import_react_dom = __toESM(require_react_dom(), 1);

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/use-layout-effect.mjs
var import_react = __toESM(require_react(), 1);
var useSafeLayoutEffect = typeof globalThis.document !== "undefined" ? import_react.useLayoutEffect : import_react.useEffect;

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/bindable.mjs
function useBindable(props) {
  const initial = props().value ?? props().defaultValue;
  const eq = props().isEqual ?? Object.is;
  const [initialValue] = (0, import_react2.useState)(initial);
  const [value, setValue] = (0, import_react2.useState)(initialValue);
  const controlled = props().value !== void 0;
  const valueRef = (0, import_react2.useRef)(value);
  valueRef.current = controlled ? props().value : value;
  const prevValue = (0, import_react2.useRef)(valueRef.current);
  useSafeLayoutEffect(() => {
    prevValue.current = valueRef.current;
  }, [value, props().value]);
  const setFn = (value2) => {
    const prev = prevValue.current;
    const next = isFunction(value2) ? value2(prev) : value2;
    if (props().debug) {
      console.log(`[bindable > ${props().debug}] setValue`, { next, prev });
    }
    if (!controlled) setValue(next);
    if (!eq(next, prev)) {
      props().onChange?.(next, prev);
    }
  };
  function get() {
    return controlled ? props().value : value;
  }
  return {
    initial: initialValue,
    ref: valueRef,
    get,
    set(value2) {
      const exec = props().sync ? import_react_dom.flushSync : identity;
      exec(() => setFn(value2));
    },
    invoke(nextValue, prevValue2) {
      props().onChange?.(nextValue, prevValue2);
    },
    hash(value2) {
      return props().hash?.(value2) ?? String(value2);
    }
  };
}
useBindable.cleanup = (fn) => {
  (0, import_react2.useEffect)(() => fn, []);
};
useBindable.ref = (defaultValue) => {
  const value = (0, import_react2.useRef)(defaultValue);
  return {
    get: () => value.current,
    set: (next) => {
      value.current = next;
    }
  };
};

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/refs.mjs
var import_react4 = __toESM(require_react(), 1);

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/stable.mjs
var import_react3 = __toESM(require_react(), 1);
function useConst(factory) {
  const ref = (0, import_react3.useRef)(void 0);
  if (ref.current === void 0) {
    ref.current = factory();
  }
  return ref.current;
}
function useStableFn(fn) {
  const ref = (0, import_react3.useRef)(fn);
  ref.current = fn;
  return (0, import_react3.useMemo)(() => {
    return ((...args) => ref.current(...args));
  }, []);
}

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/refs.mjs
function useRefs(refs) {
  const ref = (0, import_react4.useRef)(refs);
  return useConst(() => ({
    get(key) {
      return ref.current[key];
    },
    set(key, value) {
      ref.current[key] = value;
    }
  }));
}

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/track.mjs
var import_react5 = __toESM(require_react(), 1);
var useTrack = (deps, effect) => {
  const render = (0, import_react5.useRef)(false);
  const called = (0, import_react5.useRef)(false);
  (0, import_react5.useEffect)(() => {
    const mounted = render.current;
    const run = mounted && called.current;
    if (run) return effect();
    called.current = true;
  }, [...(deps ?? []).map((d) => typeof d === "function" ? d() : d)]);
  (0, import_react5.useEffect)(() => {
    render.current = true;
    return () => {
      render.current = false;
    };
  }, []);
};

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/machine.mjs
function useMachine(machine2, userProps = {}) {
  const scope = (0, import_react6.useMemo)(() => {
    const { id, ids, getRootNode: getRootNode2 } = userProps;
    return createScope({ id, ids, getRootNode: getRootNode2 });
  }, [userProps]);
  const debug = (...args) => {
    if (machine2.debug) console.log(...args);
  };
  const props = machine2.props?.({ props: compact(userProps), scope }) ?? userProps;
  const prop = useProp(props);
  const context = machine2.context?.({
    prop,
    bindable: useBindable,
    scope,
    flush,
    getContext() {
      return ctx;
    },
    getComputed() {
      return computed;
    },
    getRefs() {
      return refs;
    },
    getEvent() {
      return getEvent();
    }
  });
  const contextRef = useLiveRef(context);
  const ctx = useConst(() => ({
    get(key) {
      return contextRef.current?.[key].ref.current;
    },
    set(key, value) {
      contextRef.current?.[key].set(value);
    },
    initial(key) {
      return contextRef.current?.[key].initial;
    },
    hash(key) {
      const current = contextRef.current?.[key].get();
      return contextRef.current?.[key].hash(current);
    }
  }));
  const effects = (0, import_react6.useRef)(/* @__PURE__ */ new Map());
  const transitionRef = (0, import_react6.useRef)(null);
  const previousEventRef = (0, import_react6.useRef)(null);
  const eventRef = (0, import_react6.useRef)({ type: "" });
  const getEvent = () => ({
    ...eventRef.current,
    current() {
      return eventRef.current;
    },
    previous() {
      return previousEventRef.current;
    }
  });
  const getState = () => ({
    ...state,
    matches(...values) {
      return values.some((value) => matchesState(state.ref.current, value));
    },
    hasTag(tag) {
      return hasTag(machine2, state.ref.current, tag);
    }
  });
  const refs = useRefs(machine2.refs?.({ prop, context: ctx }) ?? {});
  const send = useStableFn((event) => {
    queueMicrotask(() => {
      if (statusRef.current !== MachineStatus.Started) return;
      previousEventRef.current = eventRef.current;
      eventRef.current = event;
      const currentState = getCurrentState();
      const { transitions, source } = findTransition(machine2, currentState, event.type);
      const transition = choose(transitions);
      if (!transition) return;
      transitionRef.current = transition;
      const target = resolveStateValue(machine2, transition.target ?? currentState, source);
      debug("transition", event.type, transition.target || currentState, `(${transition.actions})`);
      const changed = target !== currentState;
      if (changed) {
        (0, import_react_dom2.flushSync)(() => state.set(target));
      } else if (transition.reenter) {
        state.invoke(currentState, currentState);
      } else {
        action(transition.actions ?? []);
      }
    });
  });
  const computed = useStableFn((key) => {
    ensure(machine2.computed, () => `[zag-js] No computed object found on machine`);
    const fn = machine2.computed[key];
    return fn({
      context: ctx,
      event: getEvent(),
      prop,
      refs,
      scope,
      computed
    });
  });
  const getParams = () => ({
    state: getState(),
    context: ctx,
    event: getEvent(),
    prop,
    send,
    action,
    guard,
    track: useTrack,
    refs,
    computed,
    flush,
    scope,
    choose
  });
  const action = (keys) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys;
    if (!strs) return;
    const fns = strs.map((s) => {
      const fn = machine2.implementations?.actions?.[s];
      if (!fn) warn(`[zag-js] No implementation found for action "${JSON.stringify(s)}"`);
      return fn;
    });
    for (const fn of fns) {
      fn?.(getParams());
    }
  };
  const guard = (str) => {
    if (isFunction(str)) return str(getParams());
    const fn = machine2.implementations?.guards?.[str];
    if (!fn) warn(`[zag-js] No implementation found for guard "${JSON.stringify(str)}"`);
    return fn?.(getParams());
  };
  const effect = (keys) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys;
    if (!strs) return;
    const fns = strs.map((s) => {
      const fn = machine2.implementations?.effects?.[s];
      if (!fn) warn(`[zag-js] No implementation found for effect "${JSON.stringify(s)}"`);
      return fn;
    });
    const cleanups = [];
    for (const fn of fns) {
      const cleanup = fn?.(getParams());
      if (cleanup) cleanups.push(cleanup);
    }
    return () => cleanups.forEach((fn) => fn?.());
  };
  const choose = (transitions) => {
    return toArray(transitions).find((t) => {
      let result = !t.guard;
      if (isString(t.guard)) result = !!guard(t.guard);
      else if (isFunction(t.guard)) result = t.guard(getParams());
      return result;
    });
  };
  const state = useBindable(() => ({
    defaultValue: resolveStateValue(machine2, machine2.initialState({ prop })),
    onChange(nextState, prevState) {
      const { exiting, entering } = getExitEnterStates(machine2, prevState, nextState, transitionRef.current?.reenter);
      exiting.forEach((item) => {
        const exitEffects = effects.current.get(item.path);
        exitEffects?.();
        effects.current.delete(item.path);
      });
      exiting.forEach((item) => {
        action(item.state?.exit);
      });
      action(transitionRef.current?.actions);
      entering.forEach((item) => {
        const cleanup = effect(item.state?.effects);
        if (cleanup) {
          const existing = effects.current.get(item.path);
          effects.current.set(item.path, existing ? callAll(existing, cleanup) : cleanup);
        }
      });
      if (prevState === INIT_STATE) {
        action(machine2.entry);
        const cleanup = effect(machine2.effects);
        if (cleanup) {
          const existing = effects.current.get(INIT_STATE);
          effects.current.set(INIT_STATE, existing ? callAll(existing, cleanup) : cleanup);
        }
      }
      entering.forEach((item) => {
        action(item.state?.entry);
      });
    }
  }));
  const hydratedStateRef = (0, import_react6.useRef)(void 0);
  const statusRef = (0, import_react6.useRef)(MachineStatus.NotStarted);
  const getStatus = useStableFn(() => statusRef.current);
  useSafeLayoutEffect(() => {
    queueMicrotask(() => {
      const started = statusRef.current === MachineStatus.Started;
      statusRef.current = MachineStatus.Started;
      debug(started ? "rehydrating..." : "initializing...");
      const initialState = hydratedStateRef.current ?? state.initial;
      state.invoke(initialState, started ? state.get() : INIT_STATE);
    });
    const fns = effects.current;
    return () => {
      const currentState = getCurrentState();
      debug("unmounting...");
      hydratedStateRef.current = currentState;
      statusRef.current = MachineStatus.Stopped;
      fns.forEach((fn) => fn?.());
      effects.current = /* @__PURE__ */ new Map();
      transitionRef.current = null;
      queueMicrotask(() => {
        action(machine2.exit);
        statusRef.current = MachineStatus.Stopped;
      });
    };
  }, []);
  const getCurrentState = () => {
    if ("ref" in state) return state.ref.current;
    return state.get();
  };
  machine2.watch?.(getParams());
  return {
    state: getState(),
    send,
    context: ctx,
    prop,
    scope,
    refs,
    computed,
    event: getEvent(),
    getStatus
  };
}
function useLiveRef(value) {
  const ref = (0, import_react6.useRef)(value);
  ref.current = value;
  return ref;
}
function useProp(value) {
  const ref = useLiveRef(value);
  return useStableFn(function get(key) {
    return ref.current[key];
  });
}
function flush(fn) {
  queueMicrotask(() => {
    (0, import_react_dom2.flushSync)(() => fn());
  });
}

// node_modules/.pnpm/@zag-js+types@1.43.0/node_modules/@zag-js/types/dist/prop-types.mjs
function createNormalizer(fn) {
  return new Proxy({}, {
    get(_target, key) {
      if (key === "style")
        return (props) => {
          return fn({ style: props }).style;
        };
      return fn;
    }
  });
}

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/normalize-props.mjs
var normalizeProps = createNormalizer((v) => v);

// node_modules/.pnpm/@zag-js+react@1.43.0_react-dom@19.2.8_react@19.2.8/node_modules/@zag-js/react/dist/portal.mjs
var React = __toESM(require_react(), 1);
var import_react_dom3 = __toESM(require_react_dom(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);

// node_modules/.pnpm/@zag-js+async-list@1.43.0/node_modules/@zag-js/async-list/dist/async-list.connect.mjs
function connect(service) {
  const { state, context, send } = service;
  const loading = state.matches("loading", "sorting");
  const sorting = state.matches("sorting");
  const items = context.get("items");
  const cursor = context.get("cursor");
  const empty = items.length === 0;
  const hasMore = cursor != null;
  return {
    items,
    sortDescriptor: context.get("sortDescriptor"),
    loading,
    sorting,
    empty,
    hasMore,
    error: context.get("error"),
    filterText: context.get("filterText"),
    cursor,
    abort() {
      send({ type: "ABORT" });
    },
    reload() {
      send({ type: "RELOAD" });
    },
    loadMore() {
      send({ type: "LOAD_MORE" });
    },
    sort(sortDescriptor) {
      send({ type: "SORT", sortDescriptor });
    },
    setFilterText(filterText) {
      send({ type: "FILTER", filterText });
    },
    clearFilter() {
      send({ type: "FILTER", filterText: "" });
    }
  };
}

// node_modules/.pnpm/@zag-js+async-list@1.43.0/node_modules/@zag-js/async-list/dist/async-list.machine.mjs
var machine = createMachine({
  props({ props }) {
    ensureProps(props, ["load"], "load is required");
    return props;
  },
  context({ prop, bindable }) {
    return {
      items: bindable(() => ({
        defaultValue: prop("initialItems") ?? []
      })),
      cursor: bindable(() => ({
        defaultValue: null
      })),
      filterText: bindable(() => ({
        defaultValue: prop("initialFilterText") ?? ""
      })),
      sortDescriptor: bindable(() => ({
        defaultValue: prop("initialSortDescriptor")
      })),
      error: bindable(() => ({
        defaultValue: void 0
      }))
    };
  },
  refs() {
    return {
      abort: null,
      seq: 0
    };
  },
  watch({ prop, track, send }) {
    track([() => hashDeps(prop("dependencies"))], () => {
      send({ type: "RELOAD" });
    });
  },
  initialState() {
    return "idle";
  },
  on: {
    RELOAD: {
      target: "loading",
      reenter: true,
      actions: ["clearItems"]
    }
  },
  entry: ["loadIfNeeded"],
  states: {
    idle: {
      on: {
        LOAD_MORE: {
          guard: "hasCursor",
          target: "loading"
        },
        SORT: [
          {
            guard: "hasSortFn",
            target: "sorting",
            actions: ["setSortDescriptor", "clearCursor", "performSort"]
          },
          {
            target: "loading",
            actions: ["setSortDescriptor", "clearCursor"]
          }
        ],
        FILTER: {
          target: "loading",
          actions: ["setFilterText", "clearCursor"]
        }
      }
    },
    loading: {
      entry: ["performFetch"],
      exit: ["cancelFetch"],
      on: {
        SUCCESS: {
          target: "idle",
          actions: ["setItems", "setCursor", "clearError", "invokeOnSuccess"]
        },
        ERROR: {
          target: "idle",
          actions: ["setError", "invokeOnError"]
        },
        ABORT: {
          target: "idle",
          actions: ["cancelFetch"]
        },
        FILTER: {
          reenter: true,
          target: "loading",
          actions: ["setFilterText", "clearCursor"]
        }
      }
    },
    sorting: {
      on: {
        SUCCESS: {
          target: "idle",
          actions: ["setItems", "setCursor", "clearError", "invokeOnSuccess"]
        },
        ERROR: {
          target: "idle",
          actions: ["setError", "invokeOnError"]
        },
        ABORT: {
          target: "idle",
          actions: ["cancelSort"]
        },
        FILTER: {
          target: "loading",
          actions: ["setFilterText", "clearCursor", "cancelSort"]
        },
        RELOAD: {
          target: "loading",
          actions: ["clearItems", "cancelSort"]
        },
        SORT: [
          {
            guard: "hasSortFn",
            target: "sorting",
            reenter: true,
            actions: ["setSortDescriptor", "clearCursor", "cancelSort", "performSort"]
          },
          {
            target: "loading",
            actions: ["setSortDescriptor", "clearCursor", "cancelSort"]
          }
        ]
      }
    }
  },
  implementations: {
    guards: {
      hasCursor({ context }) {
        return context.get("cursor") != null;
      },
      hasSortFn({ prop }) {
        return prop("sort") != null;
      }
    },
    actions: {
      loadIfNeeded({ prop, send }) {
        if (!prop("autoReload")) return;
        send({ type: "RELOAD" });
      },
      performFetch({ context, prop, refs, send, event }) {
        refs.set("abort", new AbortController());
        const abort = refs.get("abort");
        context.set("error", void 0);
        const seq = refs.get("seq") + 1;
        refs.set("seq", seq);
        const isLoadMore = event.type === "LOAD_MORE";
        const loadFn = prop("load");
        loadFn({
          signal: abort?.signal,
          cursor: isLoadMore ? context.get("cursor") : null,
          filterText: event.filterText ?? context.get("filterText"),
          sortDescriptor: event.sortDescriptor ?? context.get("sortDescriptor")
        }).then(({ items, cursor }) => {
          if (seq !== refs.get("seq")) return;
          send({ type: "SUCCESS", items, cursor, append: isLoadMore });
        }).catch((error) => {
          if (seq !== refs.get("seq")) return;
          if (isAbortError(error)) return;
          send({ type: "ERROR", error });
        });
      },
      performSort({ context, prop, send, event, refs }) {
        const sortFn = prop("sort");
        ensure(sortFn, () => "[zag-js/async-list] sort is required");
        const currentItems = context.get("items");
        const filterText = context.get("filterText");
        const seq = refs.get("seq") + 1;
        refs.set("seq", seq);
        Promise.resolve(
          sortFn({
            items: currentItems,
            descriptor: event.sortDescriptor,
            filterText
          })
        ).then((r) => {
          if (seq !== refs.get("seq")) return;
          const sortedItems = r?.items ?? currentItems;
          send({ type: "SUCCESS", items: sortedItems, cursor: void 0, append: false });
        }).catch((e) => {
          if (seq !== refs.get("seq")) return;
          send({ type: "ERROR", error: e });
        });
      },
      setSortDescriptor({ context, event }) {
        context.set("sortDescriptor", event.sortDescriptor);
      },
      setFilterText({ context, event }) {
        context.set("filterText", event.filterText);
      },
      invokeOnSuccess({ prop, event }) {
        prop("onSuccess")?.({ items: event.items });
      },
      invokeOnError({ prop, event }) {
        prop("onError")?.({ error: event.error });
      },
      clearItems({ context }) {
        context.set("items", []);
      },
      setItems({ context, event }) {
        context.set("items", (prev) => event.append ? [...prev, ...event.items] : event.items);
      },
      setCursor({ context, event }) {
        context.set("cursor", event.cursor);
      },
      setError({ context, event }) {
        context.set("error", event.error);
      },
      clearError({ context }) {
        context.set("error", void 0);
      },
      clearCursor({ context }) {
        context.set("cursor", null);
      },
      cancelFetch({ refs }) {
        const _abort = refs.get("abort");
        _abort?.abort();
        refs.set("abort", null);
      },
      cancelSort({ refs }) {
        const seq = refs.get("seq") + 1;
        refs.set("seq", seq);
      }
    }
  }
});
function isAbortError(err) {
  return err instanceof Error && err.name === "AbortError";
}
function hashDeps(deps = []) {
  return deps.filter(Boolean).join(",");
}

// node_modules/.pnpm/@ark-ui+react@5.38.1_react-dom@19.2.8_react@19.2.8/node_modules/@ark-ui/react/dist/components/collection/use-async-list.js
function useAsyncList(props) {
  const service = useMachine(machine, props);
  return connect(service);
}

// node_modules/.pnpm/@ark-ui+react@5.38.1_react-dom@19.2.8_react@19.2.8/node_modules/@ark-ui/react/dist/utils/use-event.js
var import_react9 = __toESM(require_react(), 1);
function useEvent(callback, opts = {}) {
  const { sync = false } = opts;
  const callbackRef = useLatestRef(callback);
  return (0, import_react9.useCallback)((...args) => {
    if (sync) return queueMicrotask(() => callbackRef.current?.(...args));
    return callbackRef.current?.(...args);
  }, [sync, callbackRef]);
}
function useLatestRef(value) {
  const ref = (0, import_react9.useRef)(value);
  ref.current = value;
  return ref;
}

// node_modules/.pnpm/@ark-ui+react@5.38.1_react-dom@19.2.8_react@19.2.8/node_modules/@ark-ui/react/dist/components/collection/use-list-collection.js
var import_react10 = __toESM(require_react(), 1);
function useListCollection(props) {
  const { initialItems = [], filter: filter2, limit, ...collectionOptions } = props;
  const [items, setItemsImpl] = (0, import_react10.useState)(initialItems);
  const [filterText, setFilterText] = (0, import_react10.useState)("");
  const setItems = useEvent((items2) => {
    setItemsImpl(items2);
    setFilterText("");
  });
  const collectionOptionsRef = (0, import_react10.useRef)(collectionOptions);
  collectionOptionsRef.current = collectionOptions;
  const create = (0, import_react10.useCallback)((items2) => {
    return createListCollection({
      ...collectionOptionsRef.current,
      items: items2
    });
  }, []);
  return {
    collection: (0, import_react10.useMemo)(() => {
      let activeItems = items;
      if (filterText && filter2) activeItems = create(items).filter((itemString, _index, item) => filter2(itemString, filterText, item)).items;
      const limitedItems = limit == null ? activeItems : activeItems.slice(0, limit);
      return createListCollection({
        ...collectionOptionsRef.current,
        items: limitedItems
      });
    }, [
      items,
      filterText,
      filter2,
      limit,
      create
    ]),
    filter: useEvent((inputValue) => {
      setFilterText(inputValue || "");
    }),
    set: useEvent((newItems) => {
      setItems(newItems);
    }),
    reset: useEvent(() => {
      setItems(initialItems);
    }),
    clear: useEvent(() => {
      setItems([]);
    }),
    insert: useEvent((index, ...itemsToInsert) => {
      const newItems = create(items).insert(index, ...itemsToInsert).items;
      setItems(newItems);
    }),
    insertBefore: useEvent((value, ...itemsToInsert) => {
      const newItems = create(items).insertBefore(value, ...itemsToInsert).items;
      setItems(newItems);
    }),
    insertAfter: useEvent((value, ...itemsToInsert) => {
      const newItems = create(items).insertAfter(value, ...itemsToInsert).items;
      setItems(newItems);
    }),
    remove: useEvent((...itemOrValues) => {
      const newItems = create(items).remove(...itemOrValues).items;
      setItems(newItems);
    }),
    move: useEvent((value, to) => {
      const newItems = create(items).move(value, to).items;
      setItems(newItems);
    }),
    moveBefore: useEvent((value, ...values) => {
      const newItems = create(items).moveBefore(value, ...values).items;
      setItems(newItems);
    }),
    moveAfter: useEvent((value, ...values) => {
      const newItems = create(items).moveAfter(value, ...values).items;
      setItems(newItems);
    }),
    reorder: useEvent((from, to) => {
      const newItems = create(items).reorder(from, to).items;
      setItems(newItems);
    }),
    append: useEvent((...itemsToAppend) => {
      const newItems = create(items).append(...itemsToAppend).items;
      setItems(newItems);
    }),
    upsert: useEvent((value, item, mode = "append") => {
      const newItems = create(items).upsert(value, item, mode).items;
      setItems(newItems);
    }),
    prepend: useEvent((...itemsToPrepend) => {
      const newItems = create(items).prepend(...itemsToPrepend).items;
      setItems(newItems);
    }),
    update: useEvent((value, item) => {
      const newItems = create(items).update(value, item).items;
      setItems(newItems);
    })
  };
}

// node_modules/.pnpm/@ark-ui+react@5.38.1_react-dom@19.2.8_react@19.2.8/node_modules/@ark-ui/react/dist/components/collection/use-list-selection.js
var import_react11 = __toESM(require_react(), 1);
function useListSelection(props) {
  const { collection, selectionMode = "single", deselectable = true, initialSelectedValues = [], resetOnCollectionChange = false } = props;
  const createSelection = (0, import_react11.useCallback)((values = []) => {
    const selection2 = new Selection(values);
    selection2.selectionMode = selectionMode;
    selection2.deselectable = deselectable;
    return selection2;
  }, [selectionMode, deselectable]);
  const [selection, setSelectionState] = (0, import_react11.useState)(() => createSelection(initialSelectedValues));
  (0, import_react11.useEffect)(() => {
    if (resetOnCollectionChange) setSelectionState(createSelection());
  }, [
    collection.toString(),
    resetOnCollectionChange,
    createSelection
  ]);
  return {
    selectedValues: (0, import_react11.useMemo)(() => Array.from(selection), [selection]),
    isEmpty: (0, import_react11.useMemo)(() => selection.isEmpty(), [selection]),
    firstSelectedValue: (0, import_react11.useMemo)(() => selection.firstSelectedValue(collection), [selection, collection]),
    lastSelectedValue: (0, import_react11.useMemo)(() => selection.lastSelectedValue(collection), [selection, collection]),
    isSelected: useEvent((value) => {
      return selection.isSelected(value);
    }),
    isAllSelected: useEvent(() => {
      const allValues = collection.getValues();
      return allValues.length > 0 && allValues.every((value) => selection.isSelected(value));
    }),
    isSomeSelected: useEvent(() => {
      return collection.getValues().some((value) => selection.isSelected(value));
    }),
    canSelect: useEvent((value) => {
      return selection.canSelect(collection, value);
    }),
    select: useEvent((value, forceToggle) => {
      setSelectionState(selection.select(collection, value, forceToggle));
    }),
    deselect: useEvent((value) => {
      setSelectionState(selection.deselect(value));
    }),
    toggle: useEvent((value) => {
      setSelectionState(selection.toggleSelection(collection, value));
    }),
    replace: useEvent((value) => {
      setSelectionState(selection.replaceSelection(collection, value));
    }),
    extend: useEvent((anchorValue, targetValue) => {
      setSelectionState(selection.extendSelection(collection, anchorValue, targetValue));
    }),
    setSelectedValues: useEvent((values) => {
      setSelectionState(selection.setSelection(values));
    }),
    clear: useEvent(() => {
      setSelectionState(selection.clearSelection());
    }),
    resetSelection: useEvent(() => {
      setSelectionState(createSelection());
    })
  };
}
export {
  createFileTreeCollection,
  createGridCollection,
  createListCollection,
  createTreeCollection,
  useAsyncList,
  useListCollection,
  useListSelection
};
//# sourceMappingURL=@ark-ui_react_collection.js.map
