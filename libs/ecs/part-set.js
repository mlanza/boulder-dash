import _ from "../atomic_/core.js";
import {hashClamp} from "./part-map.js";

export function PartSet(partition, store, parts){
  this.partition = partition;
  this.store = store;
  this.parts = parts;
}

export function partSet(items = [], partition, store, parts = {}){
  return _.reduce(conj, new PartSet(partition, store, parts), items);
}

export const set = _.plug(partSet, _,
  _.pipe(_.hash, hashClamp(22)),
  _.constantly(partSet([],
    _.pipe(_.str("1", _), _.hash, hashClamp(22)),
    _.constantly(partSet([],
      _.pipe(_.str("2", _), _.hash, hashClamp(22)),
      _.constantly(_.set([])))))));

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
  return _.seq(_.concatenated(_.map(function(parts){
    return _.seq(parts);
  }, _.vals(self.parts))));
}

function first(self){
  const xs = seq(self);
  return _.first(xs);
}

function rest(self){
  const xs = seq(self);
  return _.rest(xs);
}

function empty(self){
  return new PartSet(self.partition, self.store, _.empty(self.parts));
}

function reduceWith(seq) {
  return function reduce(xs, f, init) {
    let memo = init, ys = _.seq(xs);
    while (ys && !_.isReduced(memo)) {
      memo = f(memo, _.first(ys));
      ys = _.next(ys);
    }
    return _.unreduced(memo);
  };
}

const reduce = reduceWith(seq);

_.doto(PartSet,
  _.implement(_.ISeq, {first, rest}),
  _.implement(_.IReducible, {reduce}),
  _.implement(_.ICollection, {conj}),
  _.implement(_.IEmptyableCollection, {empty}),
  _.implement(_.ISet, {disj}),
  _.implement(_.IInclusive, {includes}),
  _.implement(_.ISeqable, {seq}));
