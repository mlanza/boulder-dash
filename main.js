import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";
import dom from "./libs/atomic_/dom.js";
import r from "./libs/ecs_/reel.js";
import w from "./libs/ecs_/world.js";
import levels from "./levels.js";
import a from "./libs/ecs_/iaudible.js";
import s from "./libs/ecs_/sound.js";
import ss from "./libs/ecs_/sounds.js";
import {reg} from "./libs/cmd.js";

const fps = 10;
const throttle = 1000 / fps;
const lagging = throttle * 1.2;
const alt = _.chance(8675309);
const uid = _.pipe(_.nullary(_.uids(5, alt.random)), _.str);
const div = dom.tag("div"), span = dom.tag("span");
const el = dom.sel1("#stage");

const vars = {
  R: uid(),
  stats: uid(),
  enchantment: uid(),
  exit: uid()
}

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
const d = _.maybe(params.get("d"), parseInt) || 1;
const lvl = _.get(levels, l - 1);
const {difficulty} = lvl;
const level = _.absorb(lvl, _.get(difficulty, d - 2, {}));
const {cave, time, hint, slowGrowth} = level;
const [width, height] = level.size;

dom.addStyle(el, "width", `${width * 32}px`)
dom.addStyle(el, "height", `${height * 32}px`);
dom.attr(el, "data-cave", _.lowerCase(cave));
dom.toggleClass(document.body, "smooth", smooth);
dom.toggleClass(document.body, "debug", debug);
dom.text(dom.sel1("#hint"), hint);

el.focus();

const indestructible = true,
      growing = true,
      portal = true,
      enchanted = true,
      explosive = _.constantly(_.identity),
      exploding = true,
      collectible = true,
      diggable = true,
      gravitated = true,
      falling = true,
      rolling = true,
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
  return _.assoc(_, uid(), {noun, positioned, growing});
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
  return _.assoc(_, id, {noun, collectible, rounded, positioned, gravitated, falling});
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
  return _.assoc(_, id, {noun, pushable, rounded, positioned, gravitated, falling});
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
  }, _.sset([]), positions);
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

function settles(entities, world){
  return _.reduce(function(world, [id, {residue, positioned}]){
    return _.chain(world, _.dissoc(_, id), residue(positioned));
  }, world, entities)
}

function transitions(entities, world){
  return _.reduce(function(world, [id, {transitioning: [tick, patch]}]){
    return tick == null ? world : tick > 0 ?
      _.chain(world, w.patch(_, id, {transitioning: [tick - 1, patch]})) :
      _.chain(world, w.patch(_, id, patch));
  }, world, entities);
}

function becomes(entities, world){
  return _.reduce(function(world, [id, {becoming, positioned}]){
    const [tick, become] = becoming;
    return tick == null ? world : tick > 0 ?
      _.chain(world, w.patch(_, id, {becoming: [tick - 1, become]})) :
      _.chain(world, _.dissoc(_, id), become(positioned));
  }, world, entities);
}

function collect(id){
  return function(world){
    const {collectible} = _.maybe(id, _.get(world, _)) || {};
    const {collected, needed, worth, extras} = _.get(world, vars.stats);
    const pts = collected < needed ? worth : extras;
    return collectible ? _.chain(world,
      _.updateIn(_, [vars.stats, "collected"], _.inc),
      _.updateIn(_, [vars.stats, "score"], _.add(_, pts)),
      collected + 1 < needed ? _.identity : w.patch(_, vars.exit, {portal}),
      _.dissoc(_, id)) : world;
  }
}

function move(id, direction, from, to){
  return function(world){
    const {exploding} = _.get(world, id);
    const there = locate(world, to);
    const portal = there.entity?.portal;
    const collision = !!there.id && !portal;
    return _.chain(world,
      portal ? _.comp(_.dissoc(_, there.id), w.patch(_, id, {moving: false, facing: null, controlled: null}), _.assocIn(_, [vars.stats, "finished"], true)) : _.identity,
      collision || exploding ? _.identity : w.patch(_, id, {positioned: to}));
  };
}

function push(id, direction, from, to){
  return _.includes(["left", "right"], direction) && budge() ? function(world){
    const {pushable, falling, gravitated} = _.maybe(id, _.get(world, _)) || {};
    const occupied = _.get(world.db.via.positioned, to);
    const beneath = _.get(world, nearby(to, "down"));
    const supported = beneath && !beneath.falling;
    return _.chain(world,
      occupied || !pushable || falling ? _.identity : w.patch(_, id, Object.assign({positioned: to}, gravitated && !supported ? {falling: true, rolling: null} : {})));
  } : _.identity;
}

function dig(id){
  return function(world){
    const {diggable} = _.maybe(id, _.get(world, _)) || {};
    return diggable ? _.dissoc(world, id) : world;
  }
}

function face(id, direction){
  return _.chain(_, _.includes(["left", "right"], direction) ? w.patch(_, id, {facing: direction}) : _.identity);
}

function abort(inputs){
  return function(entities, world){
    const esc = _.chain(inputs.keys, _.includes(_, "Escape"));
    return esc ? _.reduce(function(memo, [id]){
      return w.patch(memo, id, {exploding});
    }, world, entities) : world;
  }
}

function control(inputs){
  return function(entities, world){
    const keys = _.chain(inputs.keys, _.omit(_, "Shift"), _.omit(_, "Ctrl"), _.seq);
    const stationary = _.chain(inputs.keys, _.includes(_, "Shift"));
    return _.reduce(function(memo, [id, subject]){
      const {positioned, controlled} = subject;
      const direction = _.some(_.get(controlled, _), keys);
      if (direction){
        const beyond = locate(world, nearby(positioned, direction));
        return _.chain(memo,
          w.patch(_, id, {moving}),
          face(id, direction),
          collect(beyond.id),
          dig(beyond.id),
          push(beyond.id, direction, beyond, nearby(beyond.positioned, direction)),
          stationary ? _.identity : move(id, direction, positioned, beyond.positioned));
      } else {
        return subject.moving ? w.patch(memo, id, {moving: null}) : world;
      }
    }, world, entities);
  }
}

function transmute(id, from, to){
  return function(world){
    const {noun} = _.get(world, id);
    const {status} = _.get(world, vars.enchantment);
    const blocked = _.get(world.db.via.positioned, to);
    if (status == "on" && !blocked && _.includes(["boulder", "diamond"], noun)) {
      const nid = uid();
      const make = noun === "boulder" ? diamond : boulder;
      return _.chain(world, _.dissoc(_, id), make(to, nid), w.patch(_, nid, {falling, rolling: null}));
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
    const enchantment = _.get(world, vars.enchantment);
    const top = _.get(world, id, {});
    const below = locate(world, nearby(top.positioned, "down"));
    const underneath = _.chain(top.positioned, nearby(_, "down"), nearby(_, "down"));
    const halted = below.entity && !below.entity.falling;
    return _.chain(world,
      below.entity?.enchanted && enchantment.status !== "expired" && top.falling ? _.comp(transmute(id, top.positioned, underneath), _.update(_, vars.enchantment, transform)) : _.identity,
      below.entity?.explosive ? w.patch(_, below.id, {exploding}) : _.identity,
      below.entity || !top.gravitated ? _.identity : w.patch(_, id, {positioned: below.positioned}),
      halted ? w.patch(_, id, {rolling, falling: null}) : _.identity);
  }
}

function roll(id){
  return function(world){
    const subject = _.get(world, id);
    const below = locate(world, nearby(subject.positioned, "down"));
    return _.chain(world,
      subject?.gravitated && below.entity?.rounded && !below.entity?.falling ? _.reduce(function(world, side){
        const beside = locate(world, nearby(subject.positioned, side));
        const besideBelow = locate(world, nearby(below.positioned, side));
        return beside.id || besideBelow.id ? world : _.reduced(w.patch(world, id, {positioned: beside.positioned, rolling: null, falling}));
      }, _, ["left", "right"]) : _.identity,
      w.patch(_, id, {rolling: null}));
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

function gravity(entities, world){
  const vacated = alternating(world.db.vacated);
  const surrounding = _.chain(vacated,
    _.mapcat(function(positioned){
      return [
        _.chain(positioned, nearby(_, "left")),
        _.chain(positioned, nearby(_, "right")),
        _.chain(positioned, nearby(_, "up"), nearby(_, "left")),
        _.chain(positioned, nearby(_, "up"), nearby(_, "right"))];
    }, _),
    alternating,
    _.dedupe,
    _.sort(_.asc(pinned(world)), _),
    _.map(_.get(world.db.via.positioned, _), _),
    _.compact);

  return _.chain(world,
    w.clear(["vacated"]),
    _.reduce(function(world, positioned){
      const subject = locate(world, positioned);
      const over = locate(world, nearby(positioned, "up"));
      return over.entity?.gravitated && (!subject.id || subject.entity?.falling) ? w.patch(world, over.id, {falling, rolling: null}) : world;
    }, _, vacated),
    _.reduce(function(world, id){
      const {gravitated, falling, positioned} = _.get(world, id) || {};
      const below = locate(world, nearby(positioned, "down"));
      const left = locate(world, nearby(positioned, "left"));
      const right = locate(world, nearby(positioned, "right"));
      return !gravitated || below.entity?.falling || (left.id && right.id) ? world : w.patch(world, id, {rolling: falling ? null : true });
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

function explodes(entities, world){
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

function seeks(entities, world){
  return _.reduce(function(world, [id, {positioned, seeking, going}]){
    return seek(world, id, positioned, seeking, going);
  }, world, entities);
}

function falls(entities, world){
  return _.reduce(function(world, [id]){
    return fall(id)(world);
  }, world, entities);
}

function rolls(entities, world){
  return _.reduce(function(world, [id]){
    return roll(id)(world);
  }, world, entities);
}

function countdown(ticks){
  return function(entities, world){
    const hero = _.get(world, vars.R);
    const stats =  _.getIn(world, [vars.stats]);
    const {time, started, finished} = stats;
    if (started && hero && !hero.controlled && time){
      const amt = _.min(time, 10);
      return _.chain(world, _.updateIn(_, [vars.stats, "time"], _.subtract(_, amt)), _.updateIn(_, [vars.stats, "score"], _.add(_, amt * 10)));
    }
    if (!started && _.get(world, vars.R)) {
      return _.assocIn(world, [vars.stats, "started"], ticks);
    }
    const tick = (ticks - started) % 10 === 0;
    return time === 0 && !finished ? w.patch(world, vars.R, {exploding}) : time > 0 && tick ? _.updateIn(world, [vars.stats, "time"], _.dec) : world;
  }
}

const $keys = dom.depressed(document.body);
const $inputs = $.map(function(keys){
  return {keys};
}, $keys);
const inputs = _.partial(_.deref, $inputs);
$.sub($inputs, _.noop); //without subscribers, won't activate

const blank = _.chain(
  w.world(["gravitated", "seeking", "controlled", "growing", "falling", "rolling", "exploding", "becoming", "transitioning", "residue"]),
  w.via("positioned"),
  enchantment(),
  _.assoc(_, vars.stats, _.merge(level.diamonds, {allotted: time, time, slowGrowth, ready: false, finished: false, score: 0, collected: 0})));

const $state = $.atom(r.reel(blank));
const $changed = $.map(w.changed, $state);
const $change = $.atom(null);

reg({$state, $change, $inputs, vars, r, w, sounds});

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

$.sub($change, on(vars.R, "positioned"), function({touched, props: {positioned}}){
  if (positioned === "added"){
    a.play(sounds.crack);
  }
});

$.sub($change, on("growing"), function({touched, props: {growing}, reel}){
  if (growing === "added"){
    a.play(sounds.amoeba, true);
  } else if (growing === "removed") {
    const world = r.current(reel);
    if (!_.seq(world.db.components.growing)){
      a.pause(sounds.amoeba);
    }
  }
});

$.sub($change, on(vars.stats, "collected"), function({props: {collected}}){
  if (collected === "updated"){
    a.play(sounds.collected);
  }
});

$.sub($change, on(vars.stats, "finished"), function({props: {finished}}){
  if (finished === "updated"){
    a.play(sounds.finished);
  }
});

$.sub($change, on(vars.stats, "time"), function({props: {time}, compared: [curr], reel}){
  if (time === "updated" && curr.time < 10 && curr.time > 0 && !_.chain(reel, r.current, _.getIn(_, [vars.stats, "finished"]))) {
    a.play(sounds.timeout);
  }
});

$.eachkv(function(key, digits){
  $.sub($change, on(vars.stats, key), function({compared: [curr]}){
    dom.html(dom.sel1(`#${key}`), _.map(function(char){
      return span({"data-char": char});
    }, _.lpad(_.get(curr, key), digits, 0)));
  });
}, {needed: 2, worth: 2, extras: 2, collected: 2, time: 3, score: 6});

$.sub($change, on("facing"), function({id, props: {facing}, compared: [curr]}){
  _.maybe(document.getElementById(id),
    _.includes(["added", "updated"], facing) ?
      dom.attr(_, "data-facing", curr.facing) :
      dom.removeAttr(_, "data-facing"));
});

$.sub($change, on("falling"), function({id, props: {falling}}){
  if (falling == "removed") {
    a.play(sounds.stone);
  }
  _.maybe(document.getElementById(id),
    _.includes(["added"], falling) ?
      dom.addClass(_, "falling") :
      dom.removeClass(_, "falling"));
});

$.sub($change, on("rolling"), function({id, props: {rolling}}){
  _.maybe(document.getElementById(id),
    _.includes(["added"], rolling) ?
      dom.addClass(_, "rolling") :
      dom.removeClass(_, "rolling"));
});

$.sub($change, on(vars.enchantment, "status"), function({id, props: {status}, compared: [curr]}){
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

$.sub($change, on(vars.exit, "portal"), function({id, props: {portal}, compared: [curr]}){
  _.maybe(document.body, dom.toggleClass(_, "portal", curr?.portal));
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
      delta > lagging && $.warn(`time: ${time}, delta: ${delta}, ticks: ${ticks}`);
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

const room = _.curry(function(world, at){
  const adjacent = locate(world, at);
  return !adjacent.id || adjacent.entity.diggable;
});

function suffocate(world, entities, what){
  return _.reduce(function(world, [id]){
    return w.patch(world, id, {becoming: [0, what]});
  }, world, entities);
}

function grow(world, area){
  const id = _.chain(_.map(_.first, area), _.shuffle(alt.random, _), _.first);
  const {positioned} = _.maybe(id, _.get(world, _)) || {};
  const target = _.maybe(
    positioned,
    _.plug(around, _, true),
    _.filter(room(world), _),
    _.shuffle(alt.random, _),
    _.first,
    _.plug(locate, world, _));
  return _.chain(world,
    target?.id ? _.dissoc(_, target.id) : _.identity,
    target ? amoeba(target.positioned) : _.identity);
}

function grows(entities, world){
  const size = _.count(entities);
  const {time, allotted, slowGrowth} = _.get(world, vars.stats);
  const slow = time >= allotted - slowGrowth;
  const expand = die(slow ? 32 : 4);
  const oversized = size >= 200;
  const area = _.filter(function([id, {positioned}]){
    return _.detect(room(world), around(positioned, true));
  }, entities);
  const suffocated = !_.seq(area);
  return suffocated || oversized ? suffocate(world, entities, oversized ? boulder : diamond) : expand() ? grow(world, area) : world;
}

setRafInterval(function({time, ticks, delta}){
  const inputs = _.deref($inputs);
  $.swap($state,
    _.fmap(_,
      _.pipe(
        w.system(grows, ["growing"]),
        w.system(transitions, ["transitioning"]),
        w.system(becomes, ["becoming"]),
        w.system(settles, ["residue"]),
        w.system(abort(inputs), ["controlled"]),
        w.system(control(inputs), ["controlled"]),
        w.system(seeks, ["seeking"]),
        w.system(falls, ["falling"]),
        w.system(rolls, ["rolling"]),
        w.system(gravity, ["falling"]),
        w.system(explodes, ["exploding"]),
        w.system(countdown(ticks)))));
}, throttle);
