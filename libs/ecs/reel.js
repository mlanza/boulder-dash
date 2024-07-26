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
  return current(p) === current(c) ? self : new Reel(p.max, _.update(p.frames, 0, f));
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
