import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";

export function Pile(coll, serialize, deserialize){
  this.serialize = serialize;
  this.deserialize = deserialize;
  this.coll = coll;
}

export function pile(entries = [], serialize = JSON.stringify, deserialize = JSON.parse){
  const items = _.toArray(entries);
  return _.conj(new Pile({}, serialize, deserialize), ...items);
}

export const set = pile;

function first(self){
  return _.maybe(self, _.seq, _.first);
}

function rest(self){
  return _.maybe(self, _.seq, _.rest);
}

function conj(self, value){
  return new Pile(_.assoc(self.coll, self.serialize(value), value), self.serialize, self.deserialize);
}

function disj(self, value){
  return new Pile(_.dissoc(self.coll, self.serialize(value)), self.serialize, self.deserialize);
}

function includes(self, value){
  return _.contains(self.coll, self.serialize(value));
}

function seq(self){
  return _.seq(self.coll) ? _.vals(self.coll) : null;
}

function empty(self){
  return pile([], self.serialize, self.deserialize);
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

$.doto(Pile,
  _.implement(_.IReducible, {reduce}),
  _.implement(_.ISeq, {first, rest}),
  _.implement(_.IEmptyableCollection, {empty}),
  _.implement(_.ICollection, {conj}),
  _.implement(_.ISet, {disj}),
  _.implement(_.IInclusive, {includes}),
  _.implement(_.ISeqable, {seq}));
