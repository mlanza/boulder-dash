import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {ITouchable} from "./itouchable.js";

export function TouchMap(touched, map){
  this.touched = touched;
  this.map = map;
}

export function touchMap(entries = []){
  return new TouchMap(_.map([]), _.map(entries));
}

function contains(self, key){
  return _.contains(self.map, key);
}

function assoc(self, key, value){
  const mode = _.contains(self.map, key) ? "updated" : "added";
  return new TouchMap(_.assoc(self.touched, key, mode), _.assoc(self.map, key, value));
}

function dissoc(self, key){
  return _.contains(self.map, key) ? new TouchMap(_.assoc(self.touched, key, "removed"), _.dissoc(self.map, key)) : self;;
}

function lookup(self, key){
  return _.get(self.map, key);
}

function touched1(self){
  return _.keys(self.touched);
}

function touched2(self, key){
  return _.get(self.touched, key);
}

const touched = _.overload(null, touched1, touched2);

function wipe(self){
  return new TouchMap(_.map([]), self.map);
}

$.doto(TouchMap,
  _.implement(ITouchable, {touched, wipe}),
  _.implement(_.ILookup, {lookup}),
  _.implement(_.IAssociative, {assoc, contains}),
  _.implement(_.IMap, {dissoc}));
