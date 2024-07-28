import _ from "../atomic_/core.js";

export function SerialSet(coll, serialize){
  this.serialize = serialize;
  this.coll = coll;
}

export function serialSet(entries = [], serialize = JSON.stringify){
  return _.conj(new SerialSet({}, serialize), ..._.toArray(entries));
}

export const set = serialSet;

function first(self){
  return _.maybe(self, _.seq, _.first);
}

function rest(self){
  return _.maybe(self, _.seq, _.rest);
}

function conj(self, value){
  return new SerialSet(_.assoc(self.coll, self.serialize(value), value), self.serialize);
}

function disj(self, value){
  return new SerialSet(_.dissoc(self.coll, self.serialize(value)), self.serialize);
}

function includes(self, value){
  return _.contains(self.coll, self.serialize(value));
}

function seq(self){
  return _.seq(self.coll) ? _.vals(self.coll) : null;
}

function empty(self){
  return serialSet([], self.serialize);
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

_.doto(SerialSet,
  _.implement(_.IReducible, {reduce}),
  _.implement(_.ISeq, {first, rest}),
  _.implement(_.IEmptyableCollection, {empty}),
  _.implement(_.ICollection, {conj}),
  _.implement(_.ISet, {disj}),
  _.implement(_.IInclusive, {includes}),
  _.implement(_.ISeqable, {seq}));
