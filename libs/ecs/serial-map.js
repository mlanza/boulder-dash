import _ from "../atomic_/core.js";

export function SerialMap(index, serialize, deserialize){
  this.serialize = serialize;
  this.deserialize = deserialize;
  this.index = index;
}

export function serialMap(entries, index = {}, serialize = JSON.stringify, deserialize = JSON.parse){
  return _.reduce(function(memo, [key, value]){
    return assoc(memo, key, value);
  }, new SerialMap(index, serialize, deserialize), entries);
}

export const map = serialMap;

function lookup(self, key){
  return _.get(self.index, self.serialize(key));
}

function assoc(self, key, value){
  return new SerialMap(_.assoc(self.index, self.serialize(key), value), self.serialize, self.deserialize);
}

function dissoc(self, key){
  return new SerialMap(_.dissoc(self.index, self.serialize(key)), self.serialize, self.deserialize);
}

function contains(self, key){
  return _.contains(self.index, self.serialize(key));
}

function keys(self){
  return _.map(self.deserialize, _.keys(self.index));
}

function seq(self){
  return _.seq(keys(self)) ? _.map(function(key, value){
    return [self.deserialize(key), value];
  }, _.seq(self.index)) : null;
}

_.doto(SerialMap,
  _.implement(_.ILookup, {lookup}),
  _.implement(_.IAssociative, {assoc, contains}),
  _.implement(_.ISeqable, {seq}),
  _.implement(_.IMap, {keys, dissoc}));
