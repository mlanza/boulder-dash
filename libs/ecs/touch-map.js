import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {ITouchable} from "./itouchable.js";

export function TouchMap(curr, prior = curr){
  this.curr = curr;
  this.prior = prior;
}

export function touchMap(entries = []){
  return new TouchMap(_.map(entries), _.map([]));
}

function contains(self, key){
  return _.contains(self.curr, key);
}

function assoc(self, key, value){
  return new TouchMap(_.assoc(self.curr, key, value), self.prior);
}

function dissoc(self, key){
  return new TouchMap(_.dissoc(self.curr, key), self.prior);
}

function lookup(self, key){
  return _.get(self.curr, key);
}

function touched1(self){
  return _.map(_.partial(touched2, self), _.merge(_.set(_.keys(self.curr)), _.set(_.keys(self.prior))));
}

function touched2(self, key){
  const c = _.contains(self.curr, key),
        p = _.contains(self.prior, key),
        curr = _.get(self.curr, key),
        prior = _.get(self.prior, key);
  const touch = c && !p ? "added" : p && !c ? "removed" : _.eq(curr, prior) ? null : "updated";
  return [key, touch, curr, prior];
}

const touched = _.overload(null, touched1, touched2);

function wipe(self){
  return new TouchMap(self.curr);
}

function count(self){
  return _.count(self.curr);
}

function seq(self){
  return _.seq(touched1(self));
}

$.doto(TouchMap,
  _.implement(ITouchable, {touched, wipe}),
  _.implement(_.ICounted, {count}),
  _.implement(_.ISeqable, {seq}),
  _.implement(_.ILookup, {lookup}),
  _.implement(_.IAssociative, {assoc, contains}),
  _.implement(_.IMap, {dissoc}));
