import _ from "../atomic_/core.js";

export function SerialMap(index, serialize){
  this.serialize = serialize;
  this.index = index;
}

export function serialMap(entries = [], index = {}, serialize = JSON.stringify){
  return _.reduce(function(memo, [key, value]){
    return assoc(memo, key, value);
  }, new SerialMap(index, serialize), entries);
}

export const map = serialMap;

function lookup(self, key){
  return _.getIn(self.index, [self.serialize(key), 1]);
}

function assoc(self, key, value){
  return new SerialMap(_.assoc(self.index, self.serialize(key), [key, value]), self.serialize);
}

function dissoc(self, key){
  return new SerialMap(_.dissoc(self.index, self.serialize(key)), self.serialize);
}

function contains(self, key){
  return _.contains(self.index, self.serialize(key));
}

function keys(self){
  return _.map(_.first, _.seq(self.index));
}

function seq(self){
  return _.seq(self.index) ? _.map(_.second, _.seq(self.index)) : null;
}

_.doto(SerialMap,
  _.implement(_.ILookup, {lookup}),
  _.implement(_.IAssociative, {assoc, contains}),
  _.implement(_.ISeqable, {seq}),
  _.implement(_.IMap, {keys, dissoc}));
