import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {ITouchable} from "./itouchable.js";
import * as t from "./itouchable.js";

export function TouchMap(touched, curr, prior = curr){
  this.touched = touched;
  this.curr = curr;
  this.prior = prior;
}

function touchMap1(entries){
  return new TouchMap(_.set([]), entries, _.empty(entries));
}

function touchMap0(){
  return touchMap1(_.map([]));
}

export const touchMap = _.overload(touchMap0, touchMap1);

function contains(self, key){
  return _.contains(self.curr, key);
}

function assoc(self, key, value){
  return new TouchMap(_.conj(self.touched, key), _.assoc(self.curr, key, value), self.prior);
}

function dissoc(self, key){
  return new TouchMap(_.conj(self.touched, key), _.dissoc(self.curr, key), self.prior);
}

function keys(self){
  return _.keys(self.curr);
}

function lookup(self, key){
  return _.get(self.curr, key);
}

function wipe(self){
  const curr = t.current(self), prior = t.prior(self);
  return _.isIdentical(curr, prior) ? self : new TouchMap(_.empty(self.touched), curr);
}

function count(self){
  return _.count(self.curr);
}

function seq(self){
  return _.seq(self.curr);
}

function prior(self){
  return self.prior;
}

function current(self){
  return self.curr;
}

function reducekvWith(seq){ //TODO replace
  return function reducekv(xs, f, init){
    let memo = init,
        ys = seq(xs);
    while (ys && !_.isReduced(memo)){
      memo = f(memo, ..._.first(ys));
      ys = _.next(ys);
    }
    return _.unreduced(memo);
  }
}

const reducekv = reducekvWith(seq);

$.doto(TouchMap,
  _.implement(ITouchable, {current, prior, wipe}),
  _.implement(_.IKVReducible, {reducekv}),
  _.implement(_.ICounted, {count}),
  _.implement(_.ISeqable, {seq}),
  _.implement(_.ILookup, {lookup}),
  _.implement(_.IAssociative, {assoc, contains}),
  _.implement(_.IMap, {dissoc, keys}));

export function hist(self, key){ //TODO eliminate
  return _.mapa(_.get(_, key), t.compared(self));
}

export function ephemeral(self, key){
  return _.contains(self.touched, key) && !t.existed(self, key) && !t.exists(self, key);
}
