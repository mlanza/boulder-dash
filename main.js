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

const fps = 10;
const throttle = 1000 / fps;
const lagging = throttle * 1.2;
const s = ss;
const div = dom.tag("div"), span = dom.tag("span");
const el = dom.sel1("#stage");
const vars = {
  R: w.uids(),
  stats: w.uids()
}

const params = new URLSearchParams(location.search);
const mode = params.get('mode');

dom.attr(document.body, "data-mode", mode);

el.focus();

const explosive = true,
      going = "left",
      alive = true,
      disappearing = 3,
      collectible = true,
      diggable = true,
      gravitated = true,
      falling = true,
      rounded = true,
      pushable = true,
      moving = false;

function steelWall(positioned){
  const noun = "steel-wall";
  return _.assoc(_, w.uids(), {noun, positioned});
}

function wall(positioned){
  const noun = "wall";
  return _.assoc(_, w.uids(), {noun, explosive, positioned, rounded});
}

function rockford(positioned){
  const controlled = _.map([
    ["ArrowUp", "up"],
    ["ArrowDown", "down"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"]
  ]);
  const noun = "Rockford";
  return _.assoc(_, vars.R, {noun, controlled, explosive, positioned, moving, alive});
}

function diamond(positioned){
  const noun = "diamond";
  return _.assoc(_, w.uids(), {noun, collectible, explosive, rounded, positioned, gravitated});
}

function enemy(noun, seeking){
  return function(positioned){
    return _.assoc(_, w.uids(), {noun, seeking, going, alive, explosive, positioned});
  }
}

const firefly = enemy("firefly", "clockwise");
const butterfly = enemy("butterfly", "counterclockwise");

function explosion(positioned){
  const noun = "explosion";
  return _.assoc(_, w.uids(), {noun, positioned, disappearing});
}

function dirt(positioned){
  const noun = "dirt";
  return _.assoc(_, w.uids(), {noun, diggable, explosive, positioned});
}

function boulder(positioned){
  const noun = "boulder";
  return _.assoc(_, w.uids(), {noun, pushable, explosive, rounded, positioned, gravitated});
}

const spawn = _.get({".": dirt, "X": rockford, "q": firefly, "B": butterfly, "r": boulder, "w": wall, "W": steelWall, "d": diamond, "P": dirt}, _, _.constantly(_.identity));

const board = await _.fmap(fetch("./boards/l02.txt"),  resp =>resp.text());

const positions = _.braid(_.array, _.range(40), _.range(23));

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

function vacancies(world){
  const vacancies = _.reduce(function(memo, coords){
    return _.contains(world.db.via.positioned, coords) ? memo : _.conj(memo, coords);
  }, ss.set([]), positions);
  return w.install(["vacated"],
    vacancies,
    _.plug(r.modified, _, {path: ["positioned"], pattern: {touched: _.includes(["updated", "removed"], _)}}),
    function(id, {reel, triggered}){
      const {compared} = triggered;
      const prior = compared[1];
      return _.conj(_, prior);
    })(world);
}

const vertical = _.get({"up": -1, "down": 1}, _, 0);
const horizontal = _.get({"left": -1, "right": 1}, _, 0);

const nearby = _.partly(function nearby([x, y], key, offset = 1){
  return [x + horizontal(key) * offset, y + vertical(key) * offset];
});

function around(positioned, immediate = false){
  return _.chain([["none"],["up"],["up","left"],["up","right"],["left"],["right"],["down"],["down","left"],["down","right"]],
    _.filter(function(relative){
      return !immediate || _.count(relative) == 1;
    }, _),
    _.map(function(relative){
      return _.reduce(nearby, positioned, relative);
    }, _));
}

function system(components, f, frame = null){
  return function(world){
    const inputs = world.inputs();
    return f(inputs, _.map(function(id){
      return [id, _.get(world, id)];
    }, w.having(world, components)), world, frame);
  }
}

function disappears(inputs, entities, world){
  return _.reduce(function(world, [id, entity]){
    return _.dissoc(world, id);
  }, world, entities)
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
      _.update(_, id, w.patch({moving: !collision})),
      _.includes(["left", "right"], direction) ? _.update(_, id, w.patch({facing: direction})) : _.identity,
      collision ? _.identity : _.update(_, id, w.patch({positioned: to})));
  };
}

function push(id, direction, from, to){
  return _.includes(["left", "right"], direction) ? function(world){
    const {gravitated} = _.get(world, id);
    const occupied = _.get(world.db.via.positioned, to);
    return occupied ? world : _.update(world, id, w.patch(Object.assign({positioned: to}, gravitated ? {falling: true} : {})));
  } : _.identity;
}

function dig(id){
  return _.dissoc(_, id);
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
      return w.patch(memo, id, {moving: false});
    }
  }, world, entities);
}

function fall(id){
  return function(world){
    const top = _.get(world, id, {});
    const {positioned, gravitated, falling} = top;
    const below = nearby(positioned, "down");
    const belowId = _.get(world.db.via.positioned, below);
    const bottom = _.maybe(belowId, _.get(world, _));
    const halted = bottom && !bottom.falling;
    return _.chain(world,
      !bottom?.alive ? _.identity : w.patch(_, belowId, {alive: false}),
      bottom || !gravitated ? _.identity : w.patch(_, id, {positioned: below}),
      halted ? _.comp(roll(positioned), w.patch(_, id, {falling: null})) : _.identity);
  }
}

function roll(positioned){
  return function(world){
    const id = _.get(world.db.via.positioned, positioned);
    const ent = _.get(world, id, {});
    const below = nearby(positioned, "down");
    const belowId = _.get(world.db.via.positioned, below);
    const belowEnt = _.get(world, belowId, {});
    return ent.gravitated && belowEnt.rounded && !belowEnt.falling ? _.reduce(function(world, side){
      const beside = nearby(positioned, side);
      const besideId = _.get(world.db.via.positioned, beside);
      const besideBelow = nearby(below, side);
      const besideBelowId = _.get(world.db.via.positioned, besideBelow);
      return besideId || besideBelowId ? world : _.reduced(w.patch(world, id, {positioned: beside, falling: true}));
    }, world, ["left", "right"]) : world;
  }
}

function explode(at){
  return function(world){
    const id = _.get(world.db.via.positioned, at);
    const {explosive} = _.maybe(id, _.get(world, _)) || {explosive: true};
    return _.chain(world,
      explosive ? _.comp(_.dissoc(_, id), explosion(at)) : _.identity);
  }
}

function gravity(inputs, entities, world){
  const vacated = _.sort(_.desc(_.get(_, 1)), world.db.vacated);
  return _.chain(world,
    w.clear(_, ["vacated"]),
    _.reduce(function(world, positioned){
      return _.chain(world,
        roll(_.chain(positioned, nearby(_, "left"))),
        roll(_.chain(positioned, nearby(_, "right"))),
        roll(_.chain(positioned, nearby(_, "up"), nearby(_, "left"))),
        roll(_.chain(positioned, nearby(_, "up"), nearby(_, "right"))));
    }, _, vacated),
    _.reduce(function(world, positioned){
      const over = nearby(positioned, "up");
      const overId = _.get(world.db.via.positioned, over);
      const id = _.get(world.db.via.positioned, positioned);
      const {falling} = _.get(world, id, {});
      const {gravitated} = _.get(world, overId, {});
      return gravitated && (!id || falling) ? w.patch(world, overId, {falling: true}) : world;
    }, _, vacated),
    function(world){
      return _.reduce(function(world, [id, entity]){
        return fall(id)(world);
      }, world, entities);
    });
}

function explodes(inputs, entities, world){
  return _.reduce(function(world, [id, {positioned, alive}]){
    return alive ? world : _.chain(world,
      _.dissoc(_, id),
      _.reduce(function(world, at){
        return explode(at)(world);
      }, _, around(positioned)));
  }, world, entities);
}

const counterclockwise = _.cycle(["left", "down", "right", "up"]);
const clockwise = _.cycle(["left", "up", "right", "down"]);
const orient1 = _.get({clockwise, counterclockwise}, _);
function orient2(seeking, going){
  let headings = orient1(seeking);
  do {
    headings = _.rest(headings);
  } while (_.first(headings) !== going);
  return headings;
}
const orient = _.overload(null, orient1, orient2);

function victim(world, positioned){
  return _.chain(positioned,
    _.plug(around, _, true),
    _.map(_.get(world.db.via.positioned, _), _),
    _.compact,
    _.detect(function(id){
      const {controlled, alive} = _.get(world, id, {});
      return controlled && alive;
    }, _));
}

function seek(world, id, positioned, seeking, going){
  const vid = victim(world, positioned);
  if (vid) {
    return _.chain(world,
      w.patch(_, id, {alive: false}),
      w.patch(_, vid, {alive: false}));
  }
  const headings = orient(seeking, going);
  const alt = _.second(headings);
  const alternate = nearby(positioned, alt);
  const alternateBlocked = _.get(world.db.via.positioned, alternate);
  if (alternateBlocked) {
    const dest = nearby(positioned, going);
    const destBlocked = _.get(world.db.via.positioned, dest);
    if (destBlocked) {
      const turn = _.chain(headings, _.take(3, _), _.last);
      return _.chain(world, w.patch(_, id, {going: turn}));
    } else {
      return _.chain(world, move(id, going, positioned, dest));
    }
  } else {
    return _.chain(world, w.patch(_, id, {going: alt}), move(id, alt, positioned, alternate));
  }
}

function seeks(inputs, entities, world, frame){
  return _.includes([0, 3, 6], frame) ? world : _.reduce(function(world, [id, {positioned, seeking, going}]){
    return seek(world, id, positioned, seeking, going);
  }, world, entities);
}

const $keys = dom.depressed(document.body);
const $inputs = $.map(function(keys){
  return {keys};
}, $keys);
const inputs = _.partial(_.deref, $inputs);
$.sub($inputs, _.noop); //without subscribers, won't activate

const blank = _.chain(
  w.world(inputs, ["noun", "pushable", "diggable", "rounded", "lethal", "seeking", "collectible", "explosive", "positioned", "facing", "moving", "controlled", "gravitated", "falling", "alive", "disappearing", "going"]),
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

$.sub($change, on("falling"), function({id, props: {falling}}){
  _.maybe(document.getElementById(id),
    _.includes(["added"], falling) ?
      dom.addClass(_, "falling") :
      dom.removeClass(_, "falling"));
});

$.sub($change, on("moving"), function({id, props: {moving}, compared: [curr]}){
  _.maybe(document.getElementById(id),
    $.doto(_,
      dom.toggleClass(_, "idle", !curr?.moving),
      dom.toggleClass(_, "moving", curr?.moving)));
});

$.sub($changed, $.each($.reset($change, _), _));

$.swap($state, _.fmap(_, _.comp(vacancies, load(board))));

$.on(document, "keydown", function(e){
  if (_.includes(["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft"], e.key)) {
    e.preventDefault(); //to prevent moving the page around
  }
});

function setRafInterval(callback, throttle) {
  let startTime = 0;
  let lastTime = 0;
  let rafId;
  let frame = 0;

  function tick(time) {
    if (!startTime) {
      startTime = time;
    }

    const elapsed = time - startTime;
    const expectedFrames = Math.floor(elapsed / throttle);

    if (elapsed - lastTime >= throttle) {
      frame = expectedFrames % Math.ceil(1000 / throttle);
      const delta = (elapsed - lastTime).toFixed(2);
      callback({ time, delta, frame });
      lastTime = elapsed - (elapsed % throttle);
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return function clearRafInterval() {
    cancelAnimationFrame(rafId);
  };
}

setRafInterval(function({time, delta, frame}){
  delta > lagging && $.warn(`time: ${time}, delta: ${delta}, frame: ${frame}`);

  $.swap($state, _.fmap(_,
    _.pipe(
      system(["disappearing"], disappears),
      system(["controlled"], control),
      system(["seeking"], seeks, frame),
      system(["falling"], gravity),
      system(["alive"], explodes))));

}, throttle);
