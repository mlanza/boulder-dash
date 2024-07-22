import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {ITouchable} from "./itouchable.js";

export function TouchMap(seen, curr, prior = curr){
  this.seen = seen;
  this.curr = curr;
  this.prior = prior;
}

export function touchMap(entries = []){
  return new TouchMap(_.set([]), _.map(entries), _.map([]));
}

function contains(self, key){
  return _.contains(self.curr, key);
}

function assoc(self, key, value){
  return new TouchMap(_.conj(self.seen, key), _.assoc(self.curr, key, value), self.prior);
}

function dissoc(self, key){
  return new TouchMap(self.seen, _.dissoc(self.curr, key), self.prior);
}

function keys(self){
  return _.keys(self.curr);
}

function lookup(self, key){
  return _.get(self.curr, key);
}

function touched1(self){
  return _.map(function(key){
    return [key, touched2(self, key)];
  }, _.merge(_.set(_.keys(self.curr)), _.set(_.keys(self.prior))));
}

function touched2(self, key){
  const c = _.contains(self.curr, key),
        p = _.contains(self.prior, key),
        h = hist(self);
  return c && !p ? "added" : p && !c ? "removed" : _.eq(...h) ? null : "updated";
}

const touched = _.overload(null, touched1, touched2);

function wipe(self){
  return new TouchMap(self.seen, self.curr);
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
  _.implement(_.IMap, {dissoc, keys}));

export function prior(self){
  return self.prior;
}

export function current(self){
  return self.curr;
}

export function was(self, key){
  return _.get(self.prior, key);
}

export function exists(self, key){
  return _.contains(self.curr, key);
}

export function existed(self, key){
  return _.contains(self.prior, key);
}

export function ever(self, key){
  return _.contains(self.seen, key);
}

export function ephemeral(self, key){
  return ever(self, key) && !existed(self, key) && !exists(self, key);
}

export function removed(self){
  return _.difference(_.set(_.keys(self.prior)), _.set(_.keys(self.curr)));
}

export function added(self){
  return _.difference(_.set(_.keys(self.curr)), _.set(_.keys(self.prior)));
}

export function hist(self, key){
  return _.mapa(_.get(_, key), [self.curr, self.prior]);
}
