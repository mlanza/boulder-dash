import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";
import dom from "./libs/atomic_/dom.js";
import imm from "./libs/atomic_/immutables.js";
import ss from "./libs/ecs_/serial-set.js";
import sm from "./libs/ecs_/serial-map.js";
import pm from "./libs/ecs_/part-map.js";
import ps from "./libs/ecs_/part-set.js";
import r from "./libs/ecs_/reel.js";
import w from "./libs/ecs_/world.js";
import {reg} from "./libs/cmd.js";

const s = ss;
const div = dom.tag("div"), span = dom.tag("span");
const el = dom.sel1("#stage");
const vars = {
  R: w.uids(),
  stats: w.uids()
}

el.focus();

const explosive = true,
      collectible = true,
      diggable = true,
      rounded = true,
      pushable = true,
      gravity = true;

function steelWall(positioned){
  const noun = "steel-wall";
  return _.assoc(_, w.uids(), {noun, positioned});
}

function wall(positioned){
  const noun = "wall";
  return _.assoc(_, w.uids(), {noun, explosive, positioned});
}

function rockford(positioned){
  const controlled = _.map([
    ["ArrowUp", "up"],
    ["ArrowDown", "down"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"]
  ]);
  const noun = "Rockford";
  return _.assoc(_, vars.R, {noun, controlled, explosive, positioned});
}

function diamond(positioned){
  const noun = "diamond";
  return _.assoc(_, w.uids(), {noun, collectible, explosive, rounded, positioned});
}

function dirt(positioned){
  const noun = "dirt";
  return _.assoc(_, w.uids(), {noun, diggable, explosive, positioned});
}

function enemy(noun, seeking){
  return function(positioned){
    return _.assoc(_, w.uids(), {noun, seeking, explosive, positioned});
  }
}

const firefly = enemy("firefly", "clockwise");
const butterfly = enemy("butterfly", "counterclockwise");

function boulder(positioned){
  const noun = "boulder";
  return _.assoc(_, w.uids(), {noun, pushable, explosive, rounded, gravity, positioned});
}

const spawn = _.get({".": dirt, "X": rockford, "r": boulder, "w": wall, "W": steelWall, "d": diamond, "P": dirt}, _, _.constantly(_.identity));

const board = await _.fmap(fetch("./boards/l01.txt"),  resp =>resp.text());

function load(board){
  const parts = _.chain(board,
    _.split(_, "\n"),
    _.map(_.trim, _),
    _.filter(_.seq, _),
    _.mapIndexed(function(row, chars){
      return _.mapIndexed(function(col, char){
        const coords = [col, row],
              piece = spawn(char);
        return {coords, piece};
      }, _.seq(chars));
    }, _),
    _.spread(_.concat));
  return _.reduce(function(memo, {coords, piece}){
    return _.chain(memo, piece(coords));
  }, _, parts);
}

const vertical = _.get({"up": -1, "down": 1}, _, 0);
const horizontal = _.get({"left": -1, "right": 1}, _, 0);

function nearby([x, y], key, offset = 1){
  return [x + horizontal(key) * offset, y + vertical(key) * offset];
}

function system(components, f){
  return function(world){
    const inputs = world.inputs();
    return f(inputs, _.map(function(id){
      return [id, _.get(world, id)];
    }, w.having(world, components)), world);
  }
}

function control(inputs, entities, world){
  const keys = _.chain(inputs.keys, _.omit(_, "ShiftKey"), _.omit(_, "CtrlKey"), _.seq);
  const stationary = _.chain(inputs.keys, _.includes(_, "ShiftKey"));
  return _.reduce(function(memo, [id, {positioned, controlled}]){
    const direction = _.some(_.get(controlled, _), keys);
    if (direction){
      const beyond = nearby(positioned, direction);
      const beyondId = _.get(world.db.via.positioned, beyond);
      const {diggable, pushable, collectible} = _.get(world, beyondId) || {};
      return _.chain(memo,
        collectible ? collect(beyondId) : _.identity,
        diggable ? dig(beyondId) : pushable ? push(beyondId, direction, beyond, nearby(beyond, direction)) : _.identity,
        stationary ? _.identity : move(id, direction, positioned, beyond));
    } else {
      return _.chain(memo, _.getIn(_, [id, "facing"])) ? _.chain(memo, _.update(_, id, w.patch({facing: null}))) : memo;
    }
  }, world, entities);
}

function collect(id){
  return _.pipe(
    _.updateIn(_, [vars.stats, "collected"], _.inc),
    _.dissoc(_, id));
}

function move(id, direction, from, to){
  return function(world){
    const there = _.get(world.db.via.positioned, to);
    const collision = !!there; //TODO handle collision
    return _.chain(world,
      _.update(_, id, w.patch({facing: !collision ? direction : null})),
      collision ? _.identity : _.update(_, id, w.patch({positioned: to})));
  };
}

function push(id, direction, from, to){
  return _.includes(["left", "right"], direction) ? function(world){
    const occupied = _.get(world.db.via.positioned, to);
    return occupied ? world : _.update(world, id, w.patch({positioned: to}));
  } : _.identity;
}

function dig(id){
  return _.dissoc(_, id);
}

const $keys = dom.depressed(document.body);
const $inputs = $.map(function(keys){
  return {keys};
}, $keys);
const inputs = _.partial(_.deref, $inputs);
$.sub($inputs, _.noop); //without subscribers, won't activate

const blank = _.chain(
  w.world(inputs, ["noun", "pushable", "diggable", "rounded", "lethal", "seeking", "collectible", "explosive", "gravity", "positioned", "facing", "controlled"]),
  w.via("positioned"),
  _.assoc(_, vars.stats, {total: 0, collected: 0, needed: 10, each: 10, extra: 15}));

const $state = $.atom(r.reel(blank));
const $changed = $.map(w.changed, $state);
const $change = $.atom(null);

reg({$state, $change, $inputs, vars, r, w});

function on2(id, prop){
  return _.filter(
    _.and(
      _.pipe(_.get(_, "id"), _.eq(_, id)),
      _.getIn(_, ["props", prop])));
}

function on1(prop){
  return _.filter(_.getIn(_, ["props", prop]));
}

const on = _.overload(null, on1, on2);

$.sub($change, on(vars.stats, "collected"), function({compared: [curr]}){
  dom.html(dom.sel1("#collected"), _.map(function(char){
    return span({"data-char": char});
  }, _.lpad(curr.collected, 2, 0)));
});

$.sub($change, on("facing"), function({id, props: {facing}, compared: [curr]}){
  _.maybe(document.getElementById(id),
    _.includes(["added", "updated"], facing) ?
      dom.attr(_, "data-facing", curr.facing) :
      dom.removeAttr(_, "data-facing"));
});

$.sub($change, on("positioned"), function({id, props: {positioned}, compared: [curr]}){
  switch(positioned){
    case "added": {
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

$.sub($changed, $.each($.reset($change, _), _));

$.swap($state, _.fmap(_, load(board)));

$.on(document, "keydown", function(e){
  if (_.includes(["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft"], e.key)) {
    e.preventDefault(); //to prevent moving the page around
  }
});

function setRafInterval(callback, throttle) {
  let lastTime = 0;
  let rafId;

  function tick(time) {
    if (!lastTime) {
      lastTime = time;
    }
    if (time - lastTime >= throttle) {
      callback(time);
      lastTime = time;
    }
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return function clearRafInterval() {
    cancelAnimationFrame(rafId);
  };
}

setRafInterval(function(time){
  $.swap($state, _.fmap(_, system(["positioned", "controlled"], control)));
}, 100);
