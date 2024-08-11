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
import levels from "./levels.js";
import {reg} from "./libs/cmd.js";

const fps = 10;
const throttle = 1000 / fps;
const lagging = throttle * 1.2;
const alt = _.chance(8675309);
const uid = _.pipe(_.nullary(_.uids(5, alt.random)), _.str);
const s = ss;
const div = dom.tag("div"), span = dom.tag("span");
const el = dom.sel1("#stage");
const vars = {
  R: uid(),
  stats: uid(),
  enchantment: uid(),
  exit: uid()
}

function die(n){
  return function(){
    const rolled = _.randInt(alt.random, n);
    return rolled === 0;
  }
}

const budge = die(5);

const params = new URLSearchParams(location.search);
const debug = params.get('debug') == 1;
const smooth = params.get("smooth") == 1;
const l = _.maybe(params.get("l"), parseInt) || 1;
const level = _.get(levels, l - 1);
const {time} = level;
const [width, height] = level.size;

dom.addStyle(el, "width", `${width * 32}px`)
dom.addStyle(el, "height", `${height * 32}px`);
dom.toggleClass(document.body, "smooth", smooth);
dom.toggleClass(document.body, "debug", debug);

el.focus();

const indestructible = true,
      portal = true,
      enchanted = true,
      explosive = _.constantly(_.identity),
      exploding = true,
      collectible = true,
      diggable = true,
      gravitated = true,
      falling = true,
      rounded = true,
      pushable = true,
      moving = true;

function enchantment(){
  const transitioning = [null, {status: "on", transitioning: [30 * fps, {status: "expired", transitioning: null}]}];
  return _.assoc(_, vars.enchantment, {status: "dormant", transitioning});
}

function transform(entity){
  const {transitioning} = entity;
  if (transitioning) {
    const [tick, patch] = transitioning;
    return tick == null ? _.merge(entity, patch) : entity;
  } else {
    return entity;
  }
}

function entrance(positioned){
  const noun = "entrance";
  const becoming = [25, poof];
  return _.assoc(_, uid(), {noun, positioned, indestructible, becoming});
}

function exit(positioned){
  const noun = "exit";
  return _.assoc(_, vars.exit, {noun, positioned, indestructible});
}

function poof(positioned){
  const noun = "poof";
  const becoming = [1, rockford];
  return _.assoc(_, uid(), {noun, positioned, indestructible, becoming});
}

function steelWall(positioned){
  const noun = "steel-wall";
  return _.assoc(_, uid(), {noun, positioned, indestructible});
}

function amoeba(positioned){
  const noun = "amoeba";
  return _.assoc(_, uid(), {noun, positioned, indestructible});
}

function wall(positioned){
  const noun = "wall";
  return _.assoc(_, uid(), {noun, positioned, rounded});
}

function magicWall(positioned){
  const noun = "magic-wall";
  return _.assoc(_, uid(), {noun, positioned, enchanted});
}

function rockford(positioned){
  const controlled = _.map([
    ["ArrowUp", "up"],
    ["ArrowDown", "down"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"]
  ]);
  const noun = "Rockford";
  const facing = "right";
  return _.assoc(_, vars.R, {noun, facing, controlled, explosive, positioned});
}

function diamond(positioned, id = uid()){
  const noun = "diamond";
  return _.assoc(_, id, {noun, collectible, rounded, positioned, falling, gravitated});
}

function enemy(noun, how, enemies, {going = "left", explosive = _.constantly(_.identity)} = {}){
  const seeking = {how, enemies};
  return function(positioned){
    return _.assoc(_, uid(), {noun, seeking, going, explosive, positioned});
  }
}

const firefly = enemy("firefly", "clockwise", ["Rockford", "amoeba", "butterfly"]);
const butterfly = enemy("butterfly", "counterclockwise", ["Rockford", "amoeba", "firefly"], {going: "down", explosive: diamond});

function explosion(positioned, residue = explosive){
  const noun = "explosion";
  return _.assoc(_, uid(), {noun, positioned, residue});
}

function dirt(positioned){
  const noun = "dirt";
  return _.assoc(_, uid(), {noun, diggable, positioned});
}

function boulder(positioned, id = uid()){
  const noun = "boulder";
  return _.assoc(_, id, {noun, pushable, rounded, positioned, gravitated});
}

const spawn = _.get({".": dirt, "X": debug ? rockford : entrance, "P": exit, "q": firefly, "B": butterfly, "a": amoeba, "r": boulder, "w": wall, "m": magicWall, "W": steelWall, "d": diamond}, _, _.constantly(_.identity));

const positions = _.braid(_.array, _.range(width), _.range(height));

function load(board){
  const parts = _.chain(board,
    _.split(_, "\n"),
    _.map(_.trim, _),
    _.compact,
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
  return _.chain([["none"],["up","left"],["up"],["up","right"],["left"],["right"],["down","left"], ["down"],["down","right"]],
    _.filter(function(relative){
      return !immediate || _.count(relative) == 1;
    }, _),
    _.map(function(relative){
      return _.reduce(nearby, positioned, relative);
    }, _));
}

function settles(inputs, entities, world){
  return _.reduce(function(world, [id, {residue, positioned}]){
    return _.chain(world, _.dissoc(_, id), residue(positioned));
  }, world, entities)
}

function transitions(inputs, entities, world){
  return _.reduce(function(world, [id, {transitioning: [tick, patch]}]){
    return tick == null ? world : tick > 0 ?
      _.chain(world, w.patch(_, id, {transitioning: [tick - 1, patch]})) :
      _.chain(world, w.patch(_, id, patch));
  }, world, entities);
}

function becomes(inputs, entities, world){
  return _.reduce(function(world, [id, {becoming, positioned}]){
    const [tick, become] = becoming;
    return tick == null ? world : tick > 0 ?
      _.chain(world, w.patch(_, id, {becoming: [tick - 1, become]})) :
      _.chain(world, _.dissoc(_, id), become(positioned));
  }, world, entities);
}

function collect(id){
  return function(world){
    const {collected, needed, worth, extras} = _.get(world, vars.stats);
    const pts = collected < needed ? worth : extras;
    return _.chain(world,
      _.updateIn(_, [vars.stats, "collected"], _.inc),
      _.updateIn(_, [vars.stats, "score"], _.add(_, pts)),
      collected + 1 < needed ? _.identity : w.patch(_, vars.exit, {portal}),
      _.dissoc(_, id));
  }
}

function move(id, direction, from, to){
  return function(world){
    const {exploding} = _.get(world, id);
    const there = _.get(world.db.via.positioned, to);
    const collision = !!there; //TODO handle collision
    return _.chain(world,
      collision || exploding ? _.identity : w.patch(_, id, {positioned: to}));
  };
}

function push(id, direction, from, to){
  return _.includes(["left", "right"], direction) && budge() ? function(world){
    const {gravitated} = _.get(world, id);
    const occupied = _.get(world.db.via.positioned, to);
    const beneath = _.get(world, nearby(to, "down"));
    const supported = beneath && !beneath.falling;
    return occupied ? world : w.patch(world, id, Object.assign({positioned: to}, gravitated && supported ? {falling: true} : {}));
  } : _.identity;
}

function dig(id){
  return _.dissoc(_, id);
}

function abort(inputs, entities, world){
  const esc = _.chain(inputs.keys, _.includes(_, "Escape"));
  return esc ? _.reduce(function(memo, [id]){
    return w.patch(memo, id, {exploding});
  }, world, entities) : world;
}

function control(inputs, entities, world){
  const keys = _.chain(inputs.keys, _.omit(_, "Shift"), _.omit(_, "Ctrl"), _.seq);
  const stationary = _.chain(inputs.keys, _.includes(_, "Shift"));
  return _.reduce(function(memo, [id, subject]){
    const {positioned, controlled} = subject;
    const direction = _.some(_.get(controlled, _), keys);
    if (direction){
      const beyond = nearby(positioned, direction);
      const beyondId = _.get(world.db.via.positioned, beyond);
      const {diggable, pushable, falling, collectible} = _.get(world, beyondId) || {};
      return _.chain(memo,
        w.patch(_, id, {moving}),
        _.includes(["left", "right"], direction) ? w.patch(_, id, {facing: direction}) : _.identity,
        collectible ? collect(beyondId) : _.identity,
        diggable ? dig(beyondId) : pushable && !falling ? push(beyondId, direction, beyond, nearby(beyond, direction)) : _.identity,
        stationary ? _.identity : move(id, direction, positioned, beyond));
    } else {
      return subject.moving ? w.patch(memo, id, {moving: null}) : world;
    }
  }, world, entities);
}

function transmute(id, from, to){
  return function(world){
    const {noun} = _.get(world, id);
    const {status} = _.get(world, vars.enchantment);
    const blocked = _.get(world.db.via.positioned, to);
    if (status == "on" && !blocked && _.includes(["boulder", "diamond"], noun)) {
      const nid = uid();
      const make = noun === "boulder" ? diamond : boulder;
      return _.chain(world, _.dissoc(_, id), make(to, nid), w.patch(_, nid, {falling}));
    } else {
      return world;
    }
  }
}

const locate = _.curry(function(world, positioned){
  const id = _.get(world.db.via.positioned, positioned);
  const entity = _.maybe(id, _.get(world, _));
  return {positioned, id, entity};
});

function fall(id){
  return function(world){
    const {status} = _.get(world, vars.enchantment);
    const top = _.get(world, id, {});
    const {positioned, gravitated, falling} = top;
    const below = locate(world, nearby(positioned, "down"));
    const underneath = _.chain(positioned, nearby(_, "down"), nearby(_, "down"));
    const halted = below.entity && !below.entity.falling;
    return _.chain(world,
      below.entity?.enchanted && status !== "expired" && falling ? _.comp(transmute(id, positioned, underneath), _.update(_, vars.enchantment, transform)) : _.identity,
      below.entity?.explosive ? w.patch(_, below.id, {exploding}) : _.identity,
      below.entity || !gravitated ? _.identity : w.patch(_, id, {positioned: below.positioned}),
      halted ? w.patch(_, id, {falling: null}) : _.identity);
  }
}

function roll(positioned){
  return function(world){
    const subject = locate(world, positioned);
    const below = locate(world, nearby(positioned, "down"));
    return subject.entity?.gravitated && below.entity?.rounded && !below.entity?.falling ? _.reduce(function(world, side){
      const beside = locate(world, nearby(positioned, side));
      const besideBelow = locate(world, nearby(below.positioned, side));
      return beside.id || besideBelow.id ? world : _.reduced(w.patch(world, subject.id, {positioned: beside.positioned, falling: true}));
    }, world, ["left", "right"]) : world;
  }
}

function alternate([x, y]){
  const alt = _.isEven(y) ? -1 : 1;
  return y * -100 + x * alt;
}

const alternating = _.sort(_.asc(alternate), _);

function pinned(world){ //unpinned items to roll first
  return function(positioned){
    const over = locate(world, nearby(positioned, "up"));
    return over.entity ? 1 : 0;
  }
}

function gravity(inputs, entities, world){
  const vacated = alternating(world.db.vacated);
  const surrounding = _.chain(vacated,
    _.mapcat(function(positioned){
      return [
        _.chain(positioned, nearby(_, "left")),
        _.chain(positioned, nearby(_, "right")),
        _.chain(positioned, nearby(_, "up"), nearby(_, "left")),
        _.chain(positioned, nearby(_, "up"), nearby(_, "right"))];
    }, _), alternating, _.dedupe, _.sort(_.asc(pinned(world)), _));

  return _.chain(world,
    w.clear(["vacated"]),
    _.reduce(function(world, [id, entity]){
      return fall(id)(world);
    }, _, entities),
    _.reduce(function(world, positioned){
      const subject = locate(world, positioned);
      const over = locate(world, nearby(positioned, "up"));
      return over.entity?.gravitated && (!subject.id || subject.entity?.falling) ? w.patch(world, over.id, {falling: true}) : world;
    }, _, vacated),
    _.reduce(function(world, positioned){
      return roll(positioned)(world);
    }, _, surrounding));
}

function explode(at, explosive, origin = false){
  return function(world){
    const id = _.get(world.db.via.positioned, at);
    const subject = _.maybe(id, _.get(world, _));
    if (subject){
      if (subject.indestructible) {
        return world;
      } else if (subject.explosive) {
        if (origin) {
          return _.chain(world, _.comp(_.dissoc(_, id), explosion(at, subject.explosive)));
        } else {
          return _.chain(world, w.patch(_, id, {exploding}));
        }
      } else {
        return _.chain(world, _.comp(_.dissoc(_, id), explosion(at, explosive)));
      }
    } else {
      return _.chain(world, explosion(at, explosive));
    }
  }
}

function explodes(inputs, entities, world){
  return _.reduce(function(world, [id, {positioned, explosive, exploding}]){
    return exploding && positioned ? _.chain(world,
      explode(positioned, explosive, true),
      _.reduce(function(world, at){
        return explode(at, explosive)(world);
      }, _, _.rest(around(positioned)))) : world;
  }, world, entities);
}

const counterclockwise = _.cycle(["left", "down", "right", "up"]);
const clockwise = _.cycle(["left", "up", "right", "down"]);
const orient1 = _.get({clockwise, counterclockwise}, _);
function orient2(how, going){
  let headings = orient1(how);
  do {
    headings = _.rest(headings);
  } while (_.first(headings) !== going);
  return headings;
}
const orient = _.overload(null, orient1, orient2);

function found(world, positioned, enemies){
  return _.chain(positioned,
    _.plug(around, _, true),
    _.map(_.get(world.db.via.positioned, _), _),
    _.compact,
    _.detect(function(id){
      const {noun, exploding} = _.get(world, id, {});
      return !exploding && _.includes(enemies, noun);
    }, _));
}

function seek(world, id, positioned, seeking, going){
  const {how, enemies} = seeking;
  if (found(world, positioned, enemies)) {
    return _.chain(world, w.patch(_, id, {exploding}));
  } else {
    const headings = orient(how, going);
    const alt = _.second(headings);
    const alternate = locate(world, nearby(positioned, alt));
    if (alternate.id) {
      const dest = locate(world, nearby(positioned, going));
      if (dest.id) {
        const turn = _.chain(headings, _.take(3, _), _.last);
        return _.chain(world, w.patch(_, id, {going: turn}));
      } else {
        return _.chain(world, move(id, going, positioned, dest.positioned));
      }
    } else {
      return _.chain(world, w.patch(_, id, {going: alt}), move(id, alt, positioned, alternate.positioned));
    }
  }
}

function seeks(inputs, entities, world){
  return _.reduce(function(world, [id, {positioned, seeking, going}]){
    return seek(world, id, positioned, seeking, going);
  }, world, entities);
}

function rolls(inputs, entities, world){
  return _.reduce(function(world, [id, {positioned}]){
    return roll(positioned)(world);
  }, world, entities);
}

const $keys = dom.depressed(document.body);
const $inputs = $.map(function(keys){
  return {keys};
}, $keys);
const inputs = _.partial(_.deref, $inputs);
$.sub($inputs, _.noop); //without subscribers, won't activate

const blank = _.chain(
  w.world(inputs, ["gravitated", "seeking", "controlled", "falling", "exploding", "becoming", "transitioning", "residue"]),
  w.via("positioned"),
  enchantment(),
  _.assoc(_, vars.stats, _.merge(level.diamonds, {time, score: 0, collected: 0})));

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

$.eachkv(function(key, digits){
  $.sub($change, on(vars.stats, key), function({compared: [curr]}){
    dom.html(dom.sel1(`#${key}`), _.map(function(char){
      return span({"data-char": char});
    }, _.lpad(_.get(curr, key), digits, 0)));
  });
}, {needed: 2, worth: 2, collected: 2, time: 3, score: 6});


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

$.sub($change, on(vars.enchantment, "status"), function({id, props: {status}, compared: [curr]}){
  dom.attr(el, "data-enchantment", curr.status);
});

$.sub($change, on(vars.exit, "portal"), function({id, props: {portal}, compared: [curr]}){
  dom.toggleClass(document.getElementById(id), "portal", curr.portal);
});

$.sub($change, on("moving"), function({id, props: {moving}, compared: [curr]}){
  _.maybe(document.getElementById(id),
    $.doto(_,
      dom.toggleClass(_, "idle", !curr?.moving),
      dom.toggleClass(_, "moving", !!curr?.moving)));
});

$.sub($changed, $.each($.reset($change, _), _));

$.swap($state, _.fmap(_, _.comp(vacancies, load(level.map))));

$.on(document, "keydown", function(e){
  if (_.includes(["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"], e.key)) {
    e.preventDefault(); //to prevent moving the page around
  }
});

function setRafInterval(callback, throttle) {
  let startTime = 0;
  let lastTime = 0;
  let rafId;
  let ticks = 1;

  function tick(time) {
    if (!startTime) {
      startTime = time;
    }

    const elapsed = time - startTime;
    const expectedFrames = Math.floor(elapsed / throttle);

    if (elapsed - lastTime >= throttle) {
      const delta = Math.round((elapsed - lastTime) * 100) / 100;
      callback({ time, ticks, delta });
      lastTime = elapsed - (elapsed % throttle);
      ticks++;
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return function clearRafInterval() {
    cancelAnimationFrame(rafId);
  };
}

function countdown(ticks){
  return function(inputs, entities, world){
    const stats =  _.getIn(world, [vars.stats]);
    const {time, started} = stats;
    if (!started && _.get(world, vars.R)) {
      return _.assocIn(world, [vars.stats, "started"], ticks);
    }
    const tick = (ticks - started) % 10 === 0;
    return time === 0 ? w.patch(world, vars.R, {exploding}) : time > 0 && tick ? _.updateIn(world, [vars.stats, "time"], _.dec) : world;
  }
}

setRafInterval(function({time, ticks, delta}){
  delta > lagging && $.warn(`time: ${time}, delta: ${delta}, ticks: ${ticks}`);

  $.swap($state, _.fmap(_,
    _.pipe(
      w.system(transitions, ["transitioning"]),
      w.system(becomes, ["becoming"]),
      w.system(settles, ["residue"]),
      w.system(abort, ["controlled"]),
      w.system(control, ["controlled"]),
      w.system(seeks, ["seeking"]),
      w.system(rolls, ["last-touched", "gravitated"]),
      w.system(gravity, ["falling"]),
      w.system(explodes, ["exploding"]),
      w.system(countdown(ticks)))));

}, throttle);
