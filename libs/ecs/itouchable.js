import _ from "../atomic_/core.js";

export const ITouchable = _.protocol({
  current: null,
  prior: null,
  wipe: null
});

export const current = ITouchable.current;
export const prior = ITouchable.prior;
export const wipe = ITouchable.wipe;

function touched1(self){
  return _.map(function(key){
    return [key, touchedN(self, key)];
  }, _.merge(_.set(_.keys(current(self))), _.set(_.keys(prior(self)))));
}

function touchedN(self, ...path){
  const [curr, prior] = compared(self, ...path);
  return curr != null && prior == null ? "added" : prior != null && curr == null ? "removed" : _.eq(curr, prior) ? null : "updated";
}

export const touched = _.overload(null, touched1, touchedN);

export function compared(self, ...path){
  return [_.getIn(current(self), path), _.getIn(prior(self), path)];
}

export function change(self, ...path){
  return {path, compared: compared(self, ...path), touched: touched(self, ...path)};
}

export function was(self, key){
  return _.get(prior(self), key);
}

export function exists(self, key){
  return _.get(current(self), key) != null;
}

export function existed(self, key){
  return _.get(prior(self), key) != null;
}

export function removed(self){
  return _.difference(_.set(_.keys(prior(self))), _.set(_.keys(current(self))));
}

export function added(self){
  return _.difference(_.set(_.keys(current(self))), _.set(_.keys(prior(self))));
}

