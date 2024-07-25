import _ from "../atomic_/core.js";

export const ITouchable = _.protocol({
  touched: null,
  current: null,
  prior: null,
  wipe: null
});

export const current = ITouchable.current;
export const prior = ITouchable.prior;
export const wipe = ITouchable.wipe;

function touchedN(self, ...path){
  return touch(...compared(self, ...path));
}

export const touched = _.overload(null, _.comp(_.seq, ITouchable.touched), touchedN);

export function touch(curr, prior){
  return curr != null && prior == null ? "added" : prior != null && curr == null ? "removed" : _.eq(curr, prior) ? null : "updated";
}

export function untouched(self){
  return _.difference(_.keys(self), touched(self));
}

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

export function known(self){
  return _.union(_.set(_.keys(current(self))), _.set(_.keys(prior(self))));
}
