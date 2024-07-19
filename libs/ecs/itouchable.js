import _ from "../atomic_/core.js";

export const ITouchable = _.protocol({
  touched: null,
  wipe: null
});

export const touched = _.comp(_.seq, ITouchable.touched);
export const wipe = ITouchable.wipe;
