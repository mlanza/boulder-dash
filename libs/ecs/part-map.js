import _ from "../atomic_/core.js";

export function PartMap(partition, store, parts){
  this.partition = partition;
  this.store = store;
  this.parts = parts;
}

export function partMap(entries = [], partition, store, parts = {}){
  return _.reduce(function(memo, [key, value]){
    return assoc(memo, key, value);
  }, new PartMap(partition, store, parts), entries);
}

export function hashClamp(n) {
  return function(hash){
    const m = parseInt(hash.toString().replace(".", ""));
    return ((m % n) + n) % n;
  }
}

export const map = _.plug(partMap, _,
  _.pipe(_.hash, hashClamp(11)),
  _.constantly(partMap([],
    _.pipe(_.str("a", _), _.hash, hashClamp(11)),
    _.constantly(partMap([],
      _.pipe(_.str("b", _), _.hash, hashClamp(11)),
      _.constantly({}))))));

function lookup(self, key){
  const part = self.partition(key);
  return _.getIn(self.parts, [part, key]);
}

function assoc(self, key, value){
  const part = self.partition(key);
  return new PartMap(self.partition, self.store, _.chain(
    _.contains(self.parts, part) ? self.parts : _.assoc(self.parts, part, self.store(key)),
    _.assocIn(_, [part, key], value)));
}

function dissoc(self, key){
  const part = self.partition(key);
  return new PartMap(self.partition, self.store, _.contains(self.parts, part) ? _.dissocIn(self.parts, [part, key]) : self.parts);
}

function contains(self, key){
  const part = self.partition(key);
  return _.maybe(self.parts, _.get(_, part), _.contains(_, key));
}

function keys(self){
  return _.concatenated(_.mapa(function([key, part]){
    return _.keys(part);
  }, self.parts));
}

function seq(self){
  return _.seq(_.map(function(key){
    const part = self.partition(key);
    const value = _.getIn(self.parts, [part, key]);
    return [key, value];
  }, keys(self.parts)));
}

_.doto(PartMap,
  _.implement(_.ILookup, {lookup}),
  _.implement(_.IAssociative, {assoc, contains}),
  _.implement(_.ISeqable, {seq}),
  _.implement(_.IMap, {keys, dissoc}));
