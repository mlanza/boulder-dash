import _ from "../atomic_/core.js";

export function PartSet(partition, store, parts){
  this.partition = partition;
  this.store = store;
  this.parts = parts;
}

export function partSet(items = [], partition, store, parts = {}){
  return _.reduce(conj, new PartSet(partition, store, parts), items);
}

function conj(self, value){
  const part = self.partition(value);
  return new PartSet(self.partition, self.store, _.chain(
    _.contains(self.parts, part) ? self.parts : _.assoc(self.parts, part, self.store(value)),
    _.update(_, part, _.conj(_, value))));
}

function disj(self, value){
  const part = self.partition(value);
  return new PartSet(self.partition, self.store,
    _.contains(self.parts, part) ? _.update(self.parts, part, _.disj(_, value)) : self.parts);
}

function includes(self, value){
  const part = self.partition(value);
  return _.maybe(self.parts, _.get(_, part), _.includes(_, value));
}

function seq(self){
  return _.seq(_.concatenated(function(key){
    const part = self.partition(key);
    return _.seq(_.get(self.parts, part));
  }, keys(self.parts)));
}

_.doto(PartSet,
  _.implement(_.ICollection, {conj}),
  _.implement(_.ISet, {disj}),
  _.implement(_.IInclusive, {includes}),
  _.implement(_.ISeqable, {seq}));
