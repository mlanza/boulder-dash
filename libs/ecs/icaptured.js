import _ from "../atomic_/core.js";

export const ICaptured = _.protocol({
  captured: _.identity
});

export const captured = ICaptured.captured;
