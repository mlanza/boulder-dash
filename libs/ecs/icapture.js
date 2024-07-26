import _ from "../atomic_/core.js";

export const ICapture = _.protocol({
  frame: null,
  capture: _.identity
});

export const capture = ICapture.capture;
export const frame = ICapture.frame;
