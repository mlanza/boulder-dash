import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";

$.dorun(_.map(function(x){
  const left = 32 * x;
  $.log(`[data-x='${x}'] {
  left: ${left}${left ? "px" : ""};
}`);
}, _.range(0, 50)));
$.dorun(_.map(function(y){
  const top = 32 * y;
  $.log(`[data-y='${y}'] {
  top: ${top}${top ? "px" : ""};
}`);
}, _.range(0, 50)));
