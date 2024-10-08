import * as _ from "./core.js";

import * as T from "../immutable.js";

import { Map, List, Set, OrderedMap, OrderedSet } from "../immutable.js";

export { List, OrderedMap, OrderedSet } from "../immutable.js";

import "./shell.js";

function map(obj) {
  return _.ako(obj, Map) ? obj : _.reduce((function(memo, [key, value]) {
    return memo.set(key, value);
  }), new Map, obj);
}

function list(obj) {
  return _.ako(coll, List) ? coll : _.reduce((function(memo, value) {
    return memo.add(value);
  }), new List, coll || []);
}

function equiv$2(self, other) {
  return self.equals(other);
}

function includes$1(self, value) {
  return self.includes(value);
}

function lookup$1(self, idx) {
  return self.get(idx);
}

function assoc$1(self, idx, value) {
  return self.set(idx, value);
}

function contains$1(self, idx) {
  return self.has(idx);
}

function conj$2(self, value) {
  return self.push(value);
}

function first$2(self) {
  return self.first();
}

function rest$2(self) {
  return self.rest();
}

function empty(self) {
  return self.clear();
}

function count$2(self) {
  return self.count();
}

function seq$2(self) {
  return self.size ? self : null;
}

function reduce$1(self, f, init) {
  let memo = init;
  let coll = _.seq(self);
  while (coll) {
    memo = f(memo, _.first(coll));
    coll = _.next(coll);
  }
  return _.unreduced(memo);
}

function merge$2(self, other) {
  return _.reduce(_.conj, self, other);
}

var behave$2 = _.does(_.iterable, _.keying("List"), _.implement(_.IEquiv, {
  equiv: equiv$2
}), _.implement(_.IInclusive, {
  includes: includes$1
}), _.implement(_.IAssociative, {
  assoc: assoc$1,
  contains: contains$1
}), _.implement(_.ILookup, {
  lookup: lookup$1
}), _.implement(_.IReducible, {
  reduce: reduce$1
}), _.implement(_.IMergable, {
  merge: merge$2
}), _.implement(_.IEmptyableCollection, {
  empty: empty
}), _.implement(_.ICloneable, {
  clone: _.identity
}), _.implement(_.ISeqable, {
  seq: seq$2
}), _.implement(_.ICounted, {
  count: count$2
}), _.implement(_.ICollection, {
  conj: conj$2
}), _.implement(_.ISeq, {
  first: first$2,
  rest: rest$2
}));

behave$2(List);

function assoc(self, key, value) {
  return self.set(key, value);
}

function conj$1(self, [key, value]) {
  return assoc(self, key, value);
}

function contains(self, key) {
  return self.has(key);
}

function lookup(self, key) {
  return self.get(key);
}

function count$1(self) {
  return self.size;
}

function keys(self) {
  return _.lazyIterable(self.keys());
}

function vals(self) {
  return _.lazyIterable(self.values());
}

function dissoc(self, key) {
  return self.remove(key);
}

function reducekv(self, f, init) {
  return _.reduce((function(memo, key) {
    return f(memo, key, _.get(self, key));
  }), init, keys(self));
}

function merge$1(self, other) {
  return _.reducekv(_.assoc, self, other);
}

function seq$1(self) {
  return self.size ? _.lazyIterable(self.entries()) : null;
}

function first$1(self) {
  return _.first(seq$1(self));
}

function rest$1(self) {
  return _.rest(seq$1(self));
}

function equiv$1(self, other) {
  return self.equals(other);
}

var behave$1 = _.does(_.iterable, _.keying("Map"), _.implement(_.IKVReducible, {
  reducekv: reducekv
}), _.implement(_.IEquiv, {
  equiv: equiv$1
}), _.implement(_.IMergable, {
  merge: merge$1
}), _.implement(_.ISeq, {
  first: first$1,
  rest: rest$1
}), _.implement(_.ISeqable, {
  seq: seq$1
}), _.implement(_.IMap, {
  keys: keys,
  vals: vals,
  dissoc: dissoc
}), _.implement(_.ICloneable, {
  clone: _.identity
}), _.implement(_.ICounted, {
  count: count$1
}), _.implement(_.ILookup, {
  lookup: lookup
}), _.implement(_.ICollection, {
  conj: conj$1
}), _.implement(_.IAssociative, {
  assoc: assoc,
  contains: contains
}));

behave$1(Map);

function set(coll) {
  return _.reduce((function(memo, value) {
    return memo.add(value);
  }), new Set, coll || []);
}

function emptySet() {
  return new Set;
}

function distinct2(coll, seen) {
  return _.seq(coll) ? _.lazySeq((function() {
    let xs = coll;
    while (_.seq(xs)) {
      let x = _.first(xs);
      xs = _.rest(xs);
      if (!_.includes(seen, x)) {
        return _.cons(x, distinct2(xs, _.conj(seen, x)));
      }
    }
    return _.emptyList();
  })) : _.emptyList();
}

function distinct(coll) {
  return distinct2(coll, set());
}

function seq(self) {
  return count(self) ? self : null;
}

function includes(self, value) {
  return self.has(value);
}

function conj(self, value) {
  return self.add(value);
}

function disj(self, value) {
  return self.delete(value);
}

function first(self) {
  return self.first();
}

function rest(self) {
  let tail = self.rest();
  return tail.size > 0 ? tail : emptySet();
}

function count(self) {
  return self.size;
}

function reduce(self, f, init) {
  let memo = init;
  let coll = _.seq(self);
  while (coll) {
    memo = f(memo, _.first(coll));
    coll = _.next(coll);
  }
  return _.unreduced(memo);
}

function merge(self, other) {
  return reduce(other, _.conj, self);
}

function equiv(self, other) {
  return self.equals(other);
}

var behave = _.does(_.iterable, _.keying("Set"), _.implement(_.ISequential), _.implement(_.IEquiv, {
  equiv: equiv
}), _.implement(_.IAssociative, {
  contains: includes
}), _.implement(_.IMergable, {
  merge: merge
}), _.implement(_.IReducible, {
  reduce: reduce
}), _.implement(_.ISeqable, {
  seq: seq
}), _.implement(_.IInclusive, {
  includes: includes
}), _.implement(_.ISet, {
  disj: disj,
  unite: conj
}), _.implement(_.ICloneable, {
  clone: _.identity
}), _.implement(_.IEmptyableCollection, {
  empty: emptySet
}), _.implement(_.ICollection, {
  conj: conj
}), _.implement(_.ICounted, {
  count: count
}), _.implement(_.ISeq, {
  first: first,
  rest: rest
}));

behave(Set);

function orderedMap(obj) {
  return _.ako(obj, OrderedMap) ? obj : _.reduce((function(memo, [key, value]) {
    return memo.set(key, value);
  }), new OrderedMap, obj);
}

behave$1(OrderedMap);

function orderedSet(coll) {
  return _.reduce((function(memo, value) {
    return memo.add(value);
  }), new OrderedSet, coll || []);
}

function emptyOrderedSet() {
  return new OrderedSet;
}

behave(OrderedSet);

function memoize2(f, hash) {
  const c = Symbol("cache");
  return function(self) {
    const cache = self[c] || map(), key = hash.apply(self, arguments), result = _.contains(cache, key) ? _.get(cache, key) : f.apply(self, arguments);
    self[c] = _.assoc(cache, key, result);
    return result;
  };
}

function memoize1(f) {
  return memoize2(f, (function(self, ...args) {
    return args;
  }));
}

const memoize = _.overload(null, memoize1, memoize2);

function toArray(self) {
  return self.toArray();
}

_.addMethod(_.coerce, [ T.Map, Array ], toArray);

_.addMethod(_.coerce, [ T.OrderedMap, Array ], toArray);

_.addMethod(_.coerce, [ T.Set, Array ], toArray);

_.addMethod(_.coerce, [ T.List, Array ], toArray);

export { distinct, emptyOrderedSet, emptySet, list, map, memoize, orderedMap, orderedSet, set };
