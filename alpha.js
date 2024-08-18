import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";

const left = 288;
const top = 514;

$.dorun(_.map(function(n){
  const t = top + (16 * (n + 1));
  const char = String.fromCharCode(97 + n);

$.log(`[data-char='${char}'] {
  background-position: -288px -${t}px;
}`);
}, _.range(26)));
