import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";
import dom from "./libs/atomic_/dom.js";
import r from "./libs/ecs_/reel.js";
import w from "./libs/ecs_/world.js";
import levels from "./levels.js";
import a from "./libs/ecs_/iaudible.js";
import anim from "./libs/ecs_/animated.js";
import s from "./libs/ecs_/sound.js";
import ss from "./libs/ecs_/sounds.js";
import {init, blank, vars, loop, fps} from "./boulder-dash.js";
import {reg} from "./libs/cmd.js";

const {on} = r;
const {animated, play, pause} = anim;
const params = new URLSearchParams(location.search);
const seed = _.maybe(params.get("seed"), parseInt) || 8675309;
const norandom = params.get("norandom") == 1;
const div = dom.tag("div"), span = dom.tag("span");
const el = dom.sel1("#stage");

const sounds = {
  walk: ss.sounds('./sounds/walk_d.ogg', './sounds/walk_e.ogg'),
  collected: s.sound('./sounds/diamond_collect.ogg'),
  stone: s.sound('./sounds/stone.ogg', './sounds/stone_2.ogg'),
  amoeba: s.sound('./sounds/amoeba.ogg'),
  magicWall: s.sound('./sounds/magic_wall.ogg'),
  crack: s.sound('./sounds/crack.ogg'),
  exploded: s.sound('./sounds/exploded.ogg'),
  finished: s.sound('./sounds/finished.ogg'),
  timeout: ss.sounds('./sounds/timeout_9.ogg', './sounds/timeout_8.ogg', './sounds/timeout_7.ogg', './sounds/timeout_6.ogg', './sounds/timeout_5.ogg', './sounds/timeout_4.ogg', './sounds/timeout_3.ogg', './sounds/timeout_2.ogg', './sounds/timeout_1.ogg')
}

function subs(f, unsubs = []){
  function sub(...args){
    const s = f(...args);
    unsubs.push(s);
  }
  function unsub(){
    $.each(_.invoke, unsubs);
  }
  return {sub, unsub};
}

const debug = params.get('debug') == 1;
const smooth = params.get("smooth") == 1;
const l = _.maybe(params.get("l"), parseInt) || 1;
const difficulty = _.maybe(params.get("d"), parseInt) || 1;
const random = () => _.chance(seed).random;

dom.toggleClass(document.body, "smooth", smooth);
dom.toggleClass(document.body, "debug", debug);

const $keys = dom.depressed(document.body);
const $inputs = $.map(function(keys){
  return {keys};
}, $keys);
const inputs = _.partial(_.deref, $inputs);
$.sub($inputs, _.noop); //without subscribers, won't activate

const $director = $.atom(boot({levels, difficulty, status: "idle", $stage: $.atom(r.reel(blank(random)))}, l));

$.sub($director, function({status}){
  dom.toggleClass(document.body, "paused", status == "paused");
  switch(status) {
    case "loaded":
      $.swap($director, toggle);
      break;
    case "rebooted":
      $.swap($director, start);
      break;
  }
});

function boot(data, l){
  const {levels, difficulty} = data;
  const lapped = l > _.count(levels);
  const lvl = _.get(levels, lapped ? 0 : l - 1);
  const level = _.absorb(lvl, _.get(lvl.difficulty, difficulty - 2, {}));
  return _.merge(data, {level}, lapped ? {difficulty: _.min(difficulty + 1, 4)} : null);
}

function reboot(data){
  const {$anim, unsub} = data;
  const status = "rebooted";
  unsub();
  pause($anim); //possibly restarting a level?
  return _.merge(data, {status});
}

function start(data, initial = false){
  const {$stage, level} = data;
  const {size, cave, title, hint, time, intermission} = level;
  const [width, height] = size;
  const playback = dispenser(play, pause);
  const status = "loaded";
  const stats = initial ? {score: 0, lives: 3} : _.chain($stage, _.deref, _.deref, _.get(_, vars.stats), _.selectKeys(_, ["score", "lives"]))

  dom.html(dom.sel1(`#title`), _.map(function(char){
    return span({"data-char": char});
  }, _.lowerCase(title)));
  dom.text(dom.sel1("title"), `Boulder Dash: ${title}`);

  dom.text(dom.sel1("#hint"), hint);
  dom.toggleClass(document.body, "intermission", intermission);
  dom.addStyle(el, "width", `${width * 32}px`)
  dom.addStyle(el, "height", `${height * 32}px`);
  dom.attr(el, "data-cave", _.lowerCase(cave));

  //halt leftover sound loops, if any
  a.pause(sounds.amoeba);
  a.pause(sounds.magicWall);

  const $changed = $.map(w.changed, $stage);
  const $change = $.atom(null);
  const $anim = animated(loop($inputs, $.swap($stage, _)), 1000 / fps);
  const {sub, unsub} = subs($.sub);

  sub($change, on(vars.cues, "extra-life"), function(){
    dom.addClass(document.body, "extra-life");
  });

  sub($change, on(vars.cues, "end"), function(){
    $.swap($director, end);
  });

  sub($change, on(vars.cues, "reboot"), function(){
    $.swap($director, reboot);
  });

  sub($change, on(vars.cues, "advance"), function(){
    $.swap($director, advance);
  });

  sub($change, on("positioned"), function({id, props: {positioned}, compared: [curr]}){
    if (id === vars.R && positioned === "updated") {
      a.play(sounds.walk);
    }
    switch(positioned){
      case "added": {
        if (curr.noun == "explosion") {
          a.play(sounds.exploded);
        }
        const [x, y] = curr.positioned;
        dom.append(el,
          $.doto(div({"data-noun": curr.noun, id}),
            dom.attr(_, "data-x", x),
            dom.attr(_, "data-y", y)));
        break;
      }

      case "removed": {
        _.maybe(document.getElementById(id), dom.omit(el, _));
        break;
      }

      case "updated": {
        const [x, y] = curr.positioned;
        $.doto(document.getElementById(id),
          dom.attr(_, "data-x", x),
          dom.attr(_, "data-y", y));
        break;
      }
    }
  });

  sub($change, on(vars.R, "positioned"), function({touched, props: {positioned}}){
    if (positioned === "added"){
      a.play(sounds.crack);
    }
  });

  sub($change, on("growing"), function({touched, props: {growing}, reel}){
    if (growing === "added"){
      a.play(sounds.amoeba, true);
    } else if (growing === "removed") {
      const world = r.current(reel);
      if (!_.seq(world.db.components.growing)){
        a.pause(sounds.amoeba);
      }
    }
  });

  sub($change, on(vars.stats, "collected"), function({props: {collected}}){
    if (collected === "updated"){
      a.play(sounds.collected);
    }
  });

  sub($change, on(vars.stats, "finished"), function({props: {finished}}){
    if (finished === "updated"){
      a.play(sounds.finished);
    }
  });

  sub($change, on(vars.stats, "time"), function({props: {time}, compared: [curr], reel}){
    if (time === "updated" && curr.time < 10 && curr.time > 0 && !_.chain(reel, r.current, _.getIn(_, [vars.stats, "finished"]))) {
      a.play(sounds.timeout);
    }
  });

  $.eachkv(function(key, digits){
    sub($change, on(vars.stats, key), function({compared: [curr]}){
      dom.html(dom.sel1(`#${key}`), _.map(function(char){
        return span({"data-char": char});
      }, _.lpad(_.get(curr, key), digits, 0)));
    });
  }, {needed: 2, worth: 2, extras: 2, collected: 2, time: 3, score: 6});

  sub($change, on(vars.stats, "lives"), function({compared: [curr]}){
    const {lives} = curr;
    dom.attr(dom.sel1(`#stats`), "data-lives", lives);
    dom.html(dom.sel1(`#lives`), [span({"data-char": lives}), span({"data-char": "life"})]);
  });

  sub($change, on("facing"), function({id, props: {facing}, compared: [curr]}){
    _.maybe(document.getElementById(id),
      _.includes(["added", "updated"], facing) ?
        dom.attr(_, "data-facing", curr.facing) :
        dom.removeAttr(_, "data-facing"));
  });

  sub($change, on("falling"), function({id, props: {falling}}){
    if (falling == "removed") {
      a.play(sounds.stone);
    }
    _.maybe(document.getElementById(id),
      _.includes(["added"], falling) ?
        dom.addClass(_, "falling") :
        dom.removeClass(_, "falling"));
  });

  sub($change, on("rolling"), function({id, props: {rolling}}){
    _.maybe(document.getElementById(id),
      _.includes(["added"], rolling) ?
        dom.addClass(_, "rolling") :
        dom.removeClass(_, "rolling"));
  });

  sub($change, on("exploding"), function({id, props: {exploding}}){
    _.maybe(document.getElementById(id),
      _.includes(["added"], exploding) ?
        dom.addClass(_, "exploding") :
        dom.removeClass(_, "exploding"));
  });

  sub($change, on(vars.enchantment, "status"), function({id, props: {status}, compared: [curr]}){
    switch(curr.status) {
      case "on":
        a.play(sounds.magicWall, true);
        break;
      case "expired":
        a.pause(sounds.magicWall);
        break;
    }
    dom.attr(el, "data-enchantment", curr.status);
  });

  sub($change, on(vars.exit, "portal"), function({id, props: {portal}, compared: [curr]}){
    _.maybe(document.body, dom.toggleClass(_, "portal", curr?.portal));
  });

  sub($change, on("moving"), function({id, props: {moving}, compared: [curr]}){
    _.maybe(document.getElementById(id),
      $.doto(_,
        dom.toggleClass(_, "idle", !curr?.moving),
        dom.toggleClass(_, "moving", !!curr?.moving)));
  });

  dom.html(el, null);
  $.reset($stage, init(norandom, random, level, stats)); //load the board
  sub($changed, $.each($.reset($change, _), _)); //activate the ui

  el.focus();

  return _.merge(data, {unsub, $anim, $stage, playback, status});
}

function end(data){
  const {$anim} = data;
  pause($anim);
  a.pause(sounds.amoeba);
  a.pause(sounds.magicWall);
  const status = "idle";
  return _.merge(data, {status});
}

function toggle(data){ //toggle play/pause
  const {$anim} = data;
  const {playback, status} = data;
  if (_.includes(["loaded", "playing", "paused"], status)) {
    const f = pop(playback);
    f($anim);
    return _.assoc(data, "status", f == play ? "playing" : "paused");
  } else {
    return data;
  }
}

function advance(data){
  const {level, levels, unsub, $anim} = data;
  const idx = _.indexOf(levels, level);
  unsub();
  pause($anim);
  return _.chain(data, _.plug(boot, _, idx + 2), start);
}

reg({$director, $inputs, vars, r, w, start, advance});

function Dispenser(list){
  this.list = list;
}

function dispenser(...list){
  return new Dispenser(_.cycle(list));
}

function pop(disp){
  const popped = _.first(disp.list);
  disp.list = _.rest(disp.list);
  return popped;
}

const dialog = document.getElementById("game");

$.on(document, "keydown", function(e){
  if (_.includes(["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"], e.key)) {
    e.preventDefault(); //to prevent moving the page around
  } else if (e.key === " ") {
    e.preventDefault();
    $.swap($director, toggle);
  } else if (e.key == "Enter") {
    dialog.close();
    $.swap($director, toggle);
  }
});

$.swap($director, _.plug(start, _, true));
$.swap($director, toggle);

document.body.focus();
