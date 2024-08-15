import _ from "../atomic_/core.js";

export const IAudible = _.protocol({
  play: null,
  pause: null
});

export const play = IAudible.play;
export const pause = IAudible.pause;
