import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";
import dom from "./libs/atomic_/dom.js";
import imm from "./libs/atomic_/immutables.js";
import {reg} from "./libs/cmd.js";
import p from "./libs/ecs_/serial-set.js";
import s from "./libs/ecs_/serial-map.js";
import r from "./libs/ecs_/reel.js";
import w from "./libs/ecs_/world.js";
import pm from "./libs/ecs_/part-map.js";

const div = dom.tag("div");
const el = dom.sel1("#stage");
const R = w.uids();

const explosive = true,
      collectible = true,
      diggable = true,
      rounded = true,
      pushable = true;

function steelWall(positioned){
  return _.assoc(_, w.uids(), {noun: "steel-wall", positioned});
}

function wall(positioned){
  return _.assoc(_, w.uids(), {noun: "wall", explosive, positioned});
}

function rockford(positioned){
  const controlled = _.map([
    ["ArrowUp", "up"],
    ["ArrowDown", "down"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"]
  ]);
  return _.assoc(_, R, {noun: "Rockford", controlled, explosive, positioned});
}

function diamond(positioned){
  return _.assoc(_, w.uids(), {noun: "diamond", collectible, explosive, rounded, positioned});
}

function dirt(positioned){
  return _.assoc(_, w.uids(), {noun: "dirt", diggable, explosive, positioned});
}

function enemy(noun, seeking){
  return function(positioned){
    return _.assoc(_, w.uids(), {noun, seeking, explosive, positioned});
  }
}

const firefly = enemy("firefly", "clockwise");
const butterfly = enemy("butterfly", "counterclockwise");

function boulder(positioned){
  return _.assoc(_, w.uids(), {noun: "boulder", pushable, explosive, rounded, gravity: 1, positioned});
}

const spawn = _.get({".": dirt, "X": rockford, "r": boulder, "w": wall, "W": steelWall, "d": diamond, "P": dirt}, _, _.constantly(_.identity));

const board = await _.fmap(fetch("./boards/l01.txt"),  resp =>resp.text());

function positioning(model, id, curr, prior){
  const touched = r.touched(curr, prior);
  return _.chain(model,
    _.includes(["removed", "updated"], touched) ? _.dissoc(_, prior.positioned) : _.identity,
    _.includes(["added", "updated"], touched) ? _.assoc(_, curr.positioned, id) : _.identity);
}

function collecting(model, id, curr, prior){
  const touched = r.touched(curr, prior);
  return _.chain(model,
    _.includes(["removed"], touched) ? _.pipe(_.update(_, "collected", _.inc), _.update(_, "remaining", _.dec)) : _.identity,
    _.includes(["added"], touched) ? _.update(_, "remaining", _.inc) : _.identity);
}

function load(board){
  $.log("load");
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
    }, w.tagged(components, world)), world);
  }
}

function control(inputs, entities, world){
  const keys = _.chain(inputs.keys, _.omit(_, "ShiftKey"), _.omit(_, "CtrlKey"), _.seq);
  const stationary = _.chain(inputs.keys, _.includes(_, "ShiftKey"));
  return _.reduce(function(memo, [id, {positioned, controlled}]){
    const direction = _.some(_.get(controlled, _), keys);
    if (direction){
      const beyond = nearby(positioned, direction);
      const positioning = w.views(world, "positioning");
      const beyondId = _.get(positioning, beyond);
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
  return _.dissoc(_, id);
}

function move(id, direction, from, to){
  return function(world){
    const positioning = w.views(world, "positioning");
    const there = _.get(positioning, to);
    const collision = !!there; //TODO handle collision
    return _.chain(world,
      _.update(_, id, w.patch({facing: !collision ? direction : null})),
      collision ? _.identity : _.update(_, id, w.patch({positioned: to})));
  };
}

function push(id, direction, from, to){
  return _.includes(["left", "right"], direction) ? function(world){
    const positioning = w.views(world, "positioning");
    const occupied = _.get(positioning, to);
    return occupied ? world : _.update(world, id, w.patch({positioned: to}));
  } : _.identity;
}

function dig(id){
  return _.dissoc(_, id);
}

function changed2(reel, ...path){
  const id = _.first(path);
  const compared = r.correlate(reel, _.getIn(_, path));
  const [curr, prior] = compared;
  const touched = r.correlate(reel, _.getIn(_, path), r.touched);
  const keys = path.length === 1 ? _.union(_.keys(curr), _.keys(prior)) : null;
  const components = _.reduce(function(memo, key){
    const touched = r.correlate(reel, _.getIn(_, [id, key]), r.touched);
    touched && $.assoc(memo, key, touched);
    return memo;
   }, {}, keys);
  return {id, touched, components, compared};
}

function changed1(reel){
  return _.chain(reel, r.correlate(_, function(world){
    return p.set(_.keys(world) || [], _.identity, _.identity); //TODO just touched?
  }, _.union), _.mapa(_.partial(changed2, reel), _));
}

export const changed = _.overload(null, changed1, changed2);

const $keys = dom.depressed(document.body);
const $inputs = $.map(function(keys){
  return {keys};
}, $keys);
const inputs = _.partial(_.deref, $inputs);
$.sub($inputs, _.noop); //without subscribers, won't activate

const blank = _.chain(
  w.world(inputs, ["noun", "pushable", "diggable", "rounded", "lethal", "seeking", "collectible", "explosive", "gravity", "positioned", "facing", "controlled"]),
  w.views(_, "positioning", s.map(), positioning, ["positioned"]),
  w.views(_, "collecting", {collected: 0, goal: 10, remaining: 0}, collecting, ["collectible"]));

const $state = $.atom(r.reel(blank));
const $changed = $.map(changed, $state);

reg({$state, $changed, $inputs, R, r, w, pm});
$.swap($state, _.fmap(_, load(board)));

$.sub($changed, _.filter(_.seq), function(changed){
  $.each(function({id, components, compared}){
    const [curr, prior] = compared;
    const {positioned, facing} = components;

    if (facing) {
      if (_.includes(["added", "updated"], facing)) {
        _.maybe(document.getElementById(id), dom.attr(_, "data-facing", curr.facing));
      } else {
        _.maybe(document.getElementById(id), dom.removeAttr(_, "data-facing"));
      }
    }

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
  }, changed);
});

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
