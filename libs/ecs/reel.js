import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as c from "./icapture.js";

export function Reel(max, frames){
  this.max = max;
  this.frames = frames;
}

export function reel(state, max = 2){
  return new Reel(max, [state]);
}

export function edit(curr, prior){
  return new Reel(2, [curr, prior]);
}

function conform(pattern, obj){
  return _.reducekv(function(memo, key, pred){
    const value = _.get(obj, key);
    return memo ? (_.isFunction(pred) ? pred(value) : conform(pred, value)) : _.reduced(memo);
  }, true, pattern);
}

export function modified(id, {path = [], props = null, pattern = null} = {}){
  const fullPath = [id].concat(path);
  const inside = _.getIn(_, fullPath);
  return function(reel){
    const compared = correlate(reel, inside);
    const [curr, prior] = compared;
    const _touched = correlate(reel, inside, touched);
    const _props = _.chain(_touched ? _.reduce(function(memo, key){
      const t = correlate(reel, _.getIn(_, fullPath.concat([key])), touched);
      t && $.assoc(memo, key, t);
      return memo;
     }, {}, props || _.union(_.keys(curr), _.keys(prior))) : {}, _.compact, _.blot);
    if (_touched) {
      const change = {id, path, touched: _touched, props: _props, compared};
      return conform(pattern, change) ? change : null;
    } else {
      return null;
    }
  }
}

export function frame(self, offset = 0){
  return _.get(self.frames, offset * -1, null);
}

function capture(self){
  const captured = _.chain(self, frame, c.capture);
  const frames = _.clone(self.frames);
  frames.unshift(captured); //keep the current frame up front
  if (frames.length > self.max) {
    frames.pop();
  }
  return new Reel(self.max, frames);
}

function fmap(self, f){
  const p = capture(self);
  const c = new Reel(p.max, _.update(p.frames, 0, f));
  return current(p) === current(c) ? self : c;
}

const deref = _.unary(frame);

export const current = deref;
export const prior = _.plug(frame, _, -1);

export function correlate(self, select = _.identity, compare = _.array, first = 0, second = first - 1){
  const curr = select(frame(self, first)),
        prior = select(frame(self, second));
  return compare(curr, prior);
}

export function touched(curr, prior){
  return curr != null && prior == null ? "added" : prior != null && curr == null ? "removed" : _.eq(curr, prior) ? null : "updated";
}

$.doto(Reel,
  _.implement(c.ICapture, {capture, frame}),
  _.implement(_.IFunctor, {fmap}),
  _.implement(_.IDeref, {deref}));
