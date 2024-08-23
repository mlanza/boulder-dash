import _ from "../atomic_/core.js";

export function Dispenser(list){
  this.list = list;
}

export function dispenser(...list){
  return new Dispenser(_.cycle(list));
}

export function pop(disp){
  const popped = _.first(disp.list);
  disp.list = _.rest(disp.list);
  return popped;
}
