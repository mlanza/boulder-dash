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
import {reg} from "./libs/cmd.js";

const {animated, play, pause} = anim;
const params = new URLSearchParams(location.search);
const seed = _.maybe(params.get("seed"), parseInt) || 8675309;
const norandom = params.get("norandom") == 1;
const fps = 10;
const div = dom.tag("div"), span = dom.tag("span");
const el = dom.sel1("#stage");

const vars = {
  R: "rockford",
  entrance: "entrance",
  stats: "stats",
  cues: "cues",
  enchantment: "enchantment",
  exit: "exit",
  level: "level"
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

function die2(random, n){
  return function(){
    const rolled = _.randInt(random, n);
    return rolled === 0;
  }
}

function die3(random, n, pool){
  return function(){
    const rolled = _.randInt(random, pool);
    return n > rolled;
  }
}

const die = _.overload(null, null, die2, die3);
const debug = params.get('debug') == 1;
const smooth = params.get("smooth") == 1;
const l = _.maybe(params.get("l"), parseInt) || 1;
const d = _.maybe(params.get("d"), parseInt) || 1;

dom.toggleClass(document.body, "smooth", smooth);
dom.toggleClass(document.body, "debug", debug);

const vacant = _.constantly(_.identity);

const indestructible = true,
      portal = true,
      enchanted = true,
      collectible = true,
      diggable = true,
      gravitated = true,
      growing = true,
      falling = true,
      rolling = true,
      exploding = true,
      explosive = vacant,
      rounded = true,
      pushable = true,
      moving = true;

function enchantment(){
  const transitioning = [null, {status: "on", transitioning: [30 * fps, {status: "expired", transitioning: null}]}];
  return _.assoc(_, vars.enchantment, {status: "dormant", transitioning});
}

function entrance(positioned){
  const noun = "entrance";
  return function(world){
    const {arrive} = _.get(world, vars.level);
    const becoming = [arrive || 25, poof];
    return _.assoc(world, vars.entrance, {noun, positioned, indestructible, becoming});
  }
}

function exit(positioned){
  const noun = "exit";
  return _.assoc(_, vars.exit, {noun, positioned, indestructible});
}

function poof(positioned){
  const noun = "poof";
  const becoming = [1, rockford];
  return _.conj(_, {noun, positioned, indestructible, becoming});
}

function steelWall(positioned){
  const noun = "steel-wall";
  return _.conj(_, {noun, positioned, indestructible});
}

function amoeba(positioned){
  const noun = "amoeba";
  return _.conj(_, {noun, positioned, growing});
}

function wall(positioned){
  const noun = "wall";
  return _.conj(_, {noun, positioned, rounded});
}

function magicWall(positioned){
  const noun = "magic-wall";
  const transitioning = [5, {enchanted}]
  return _.conj(_, {noun, positioned, transitioning});
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

function diamond(positioned, id = null){
  const noun = "diamond";
  return function(world){
    return _.assoc(world, id || w.uid(world), {noun, collectible, rounded, positioned, gravitated, falling});
  }
}

function enemy(noun, how, enemies, {going = "left", explosive = vacant} = {}){
  const seeking = {how, enemies};
  return function(positioned){
    return _.conj(_, {noun, seeking, going, explosive, positioned});
  }
}

const firefly = enemy("firefly", "counterclockwise", ["Rockford", "amoeba", "butterfly"]);
const butterfly = enemy("butterfly", "clockwise", ["Rockford", "amoeba", "firefly"], {going: "down", explosive: diamond});

function explosion(positioned, residue = explosive){
  const noun = "explosion";
  return _.conj(_, {noun, positioned, residue});
}

function dirt(positioned){
  const noun = "dirt";
  return _.conj(_, {noun, diggable, positioned});
}

function boulder(positioned, id = null){
  const noun = "boulder";
  return function(world){
    return _.assoc(world, id || w.uid(world), {noun, pushable, rounded, positioned, gravitated, falling});
  }
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

const spawn = _.get({".": dirt, "X": debug ? rockford : entrance, "P": exit, "q": firefly, "B": butterfly, "a": amoeba, "r": boulder, "w": wall, "m": magicWall, "W": steelWall, "d": diamond}, _, vacant);

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

function scan([x,y]){
  return _.braid(_.array, _.range(x), _.range(y));
}

function randomize(world){
  const {randoms, size} = _.get(world, vars.level);
  const {positioned} = _.get(world, vars.entrance);
  const untouched = _.sset(_.toArray(around(positioned)));
  const targets = {
    "vacant": {target: ["dirt", "boulder"], what: vacant},
    "boulder": {target: [undefined, "dirt"], what: boulder},
    "diamond": {target: [undefined, "dirt", "boulder"], what: diamond},
    "wall": {target: ["boulder"], what: wall},
    "firefly": {target: [undefined, "dirt", "boulder"], what: firefly}
  }
  return _.chain(size,
    scan,
    _.map(locate(world), _),
    _.filter(function(x){
      return !x.entity?.indestructible && !_.includes(untouched, x.positioned);
    }, _),
    _.map(function(was){
      return _.reducekv(function({was, instead}, noun, [n, pool]){
        const d = die(world.random, n, pool);
        const {target, what} = _.get(targets, noun, {});
        return target && _.includes(target, was.entity?.noun) && d() ? _.reduced({was, instead: what}) : {was, instead};
      }, {was, instead: undefined}, randoms || {});
    }, _),
  _.filter(({instead}) => instead !== undefined, _),
  _.reduce(function(world, {was, instead}){
    return _.chain(world,
      _.dissoc(_, was.id),
      instead(was.positioned));
  }, world, _));
}

function vacancies(world){
  const {size} = _.get(world, vars.level);
  const vacancies = _.reduce(function(memo, coords){
    return _.contains(world.db.via.positioned, coords) ? memo : _.conj(memo, coords);
  }, _.sset([]), scan(size));
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

function nearby2([x, y], key){
  return [x + horizontal(key), y + vertical(key)];
}

function nearbyN(positioned, ...directions){
  return _.reduce(nearby2, positioned, directions);
}

const nearby = _.partly(_.overload(null, nearby2, nearbyN));

function around(positioned, immediate = false){
  return _.chain([["none"],["up","left"],["up"],["up","right"],["left"],["right"],["down","left"], ["down"],["down","right"]],
    _.filter(function(relative){
      return !immediate || _.count(relative) == 1;
    }, _),
    _.map(function(relative){
      return _.reduce(nearby, positioned, relative);
    }, _));
}

function settles(world, entities){
  return _.reduce(function(world, [id, {residue, positioned}]){
    return _.chain(world, _.dissoc(_, id), residue(positioned));
  }, world, entities)
}

function transitions(world, entities){
  return _.reduce(function(world, [id, {transitioning: [tick, patch]}]){
    return tick == null ? world : tick > 0 ?
      _.chain(world, w.patch(_, id, {transitioning: [tick - 1, patch]})) :
      _.chain(world, w.patch(_, id, patch));
  }, world, entities);
}

function becomes(world, entities){
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
      portal ? _.comp(_.dissoc(_, there.id), w.patch(_, id, {moving: false, indestructible, facing: null, controlled: null}), _.assocIn(_, [vars.stats, "finished"], true)) : _.identity,
      collision || exploding ? _.identity : w.patch(_, id, {positioned: to}));
  };
}

function push(id, direction, from, to){
  return _.includes(["left", "right"], direction) ? function(world){
    const budge = die(world.random, 5);
    if (!budge()){
      return world;
    }
    const {pushable, falling, gravitated} = _.maybe(id, _.get(world, _)) || {};
    const occupied = locate(world, to);
    const beneath = locate(world, to, "down");
    const supported = beneath.id && !beneath.entity?.falling;
    return _.chain(world,
      occupied.id || !pushable || falling ? _.identity : w.patch(_, id, Object.assign({positioned: to}, gravitated && !supported ? {falling: true, rolling: null} : {})));
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
  return function(world, entities){
    const esc = _.chain(inputs.keys, _.includes(_, "Escape"));
    return esc ? _.reduce(function(memo, [id]){
      return w.patch(memo, id, {exploding});
    }, world, entities) : world;
  }
}

function control(inputs){
  return function(world, entities){
    const keys = _.chain(inputs.keys, _.omit(_, "Shift"), _.omit(_, "Ctrl"), _.seq);
    const stationary = _.chain(inputs.keys, _.includes(_, "Shift"));
    return _.reduce(function(memo, [id, subject]){
      const {positioned, controlled} = subject;
      const direction = _.some(_.get(controlled, _), keys);
      if (direction){
        const beyond = locate(world, positioned, direction);
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

function transmute(id){
  return function(world){
    const {noun, positioned} = _.get(world, id);
    const {status} = _.get(world, vars.enchantment);
    const underneath = locate(world, positioned, "down", "down");
    if (status == "on" && _.includes(["boulder", "diamond"], noun)) {
      const nid = w.uid(world);
      const make = noun === "boulder" ? diamond : boulder;
      return _.chain(world, w.patch(_, id, {falling: null, rolling: null}), _.dissoc(_, id), underneath.id ? _.identity : make(underneath.positioned, nid), w.patch(_, nid, {falling, rolling: null}));
    } else {
      return world;
    }
  }
}

const locate = _.curry(function(world, start, ...directions){
  const positioned = _.reduce(nearby, start, directions);
  const id = _.get(world.db.via.positioned, positioned);
  const entity = _.maybe(id, _.get(world, _));
  return {positioned, id, entity};
}, 2);

function fall(id){
  return function(world){
    const enchantment = _.get(world, vars.enchantment);
    const top = _.get(world, id, {});
    const below = locate(world, top.positioned, "down");
    const transmuting = below.entity?.enchanted && enchantment.status !== "expired" && top.falling;
    const halted = !transmuting && below.entity && !below.entity.falling;
    return _.chain(world,
      transmuting ? _.comp(transmute(id), _.update(_, vars.enchantment, transform)) : _.identity,
      below.entity?.explosive ? w.patch(_, below.id, {exploding}) : _.identity,
      below.entity || !top.gravitated ? _.identity : w.patch(_, id, {positioned: below.positioned}),
      halted ? w.patch(_, id, {rolling, falling: null}) : _.identity);
  }
}

function roll(id){
  return function(world){
    const subject = _.get(world, id);
    const below = locate(world, subject.positioned, "down");
    return _.chain(world,
      subject?.gravitated && below.entity?.rounded && !below.entity?.falling ? _.reduce(function(world, side){
        const beside = locate(world, subject.positioned, side);
        const besideBelow = locate(world, below.positioned, side);
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
    const over = locate(world, positioned, "up");
    return over.entity ? 1 : 0;
  }
}

const loose = _.juxt(
  nearby(_, "left"),
  nearby(_, "right"),
  nearby(_, "up", "left"),
  nearby(_, "up", "right"));

function gravity(world){
  const vacated = alternating(world.db.vacated);
  const surrounding = _.chain(vacated,
    _.mapcat(loose, _),
    alternating,
    _.dedupe,
    _.sort(_.asc(pinned(world)), _),
    _.map(_.get(world.db.via.positioned, _), _),
    _.compact);

  return _.chain(world,
    w.clear(["vacated"]),
    _.reduce(function(world, positioned){
      const subject = locate(world, positioned);
      const over = locate(world, positioned, "up");
      return over.entity?.gravitated && (!subject.id || subject.entity?.falling) ? w.patch(world, over.id, {falling, rolling: null}) : world;
    }, _, vacated),
    _.reduce(function(world, id){
      const {gravitated, falling, positioned} = _.get(world, id) || {};
      const below = locate(world, positioned, "down");
      const left = locate(world, positioned, "left");
      const right = locate(world, positioned, "right");
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

function explodes(world, entities){
  const die = _.updateIn(_, [vars.stats, "lives"], _.dec);
  const reboot = w.patch(_, vars.cues, {transitioning: [25, {reboot: true, transitioning: null}]});
  const end = w.patch(_, vars.cues, {transitioning: [25, {end: true, transitioning: null}]});
  return _.reduce(function(world, [id, {positioned, explosive, exploding}]){
    return exploding && positioned ? _.chain(world,
      explode(positioned, explosive, true),
      id === vars.R ? _.comp(_.getIn(world, [vars.stats, "lives"]) == 1 ? end : reboot, die) : _.identity,
      _.reduce(function(world, at){
        return explode(at, explosive)(world);
      }, _, _.rest(around(positioned)))) : world;
  }, world, entities);
}

const clockwise = _.cycle(["left", "down", "right", "up"]);
const counterclockwise = _.cycle(["left", "up", "right", "down"]);
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
    const alternate = locate(world, positioned, alt);
    if (alternate.id) {
      const dest = locate(world, positioned, going);
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

function seeks(world, entities){
  return _.reduce(function(world, [id, {positioned, seeking, going}]){
    return seek(world, id, positioned, seeking, going);
  }, world, entities);
}

function falls(world, entities){
  return _.reduce(function(world, [id]){
    return fall(id)(world);
  }, world, entities);
}

function rolls(world, entities){
  return _.reduce(function(world, [id]){
    return roll(id)(world);
  }, world, entities);
}

function countdown(ticks){
  return function(world, entities){
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
  const id = _.chain(_.map(_.first, area), _.shuffle(world.random, _), _.first);
  const {positioned} = _.maybe(id, _.get(world, _)) || {};
  const target = _.maybe(
    positioned,
    _.plug(around, _, true),
    _.filter(room(world), _),
    _.shuffle(world.random, _),
    _.first,
    _.plug(locate, world, _));
  return _.chain(world,
    target?.id ? _.dissoc(_, target.id) : _.identity,
    target ? amoeba(target.positioned) : _.identity);
}

function grows(world, entities){
  const size = _.count(entities);
  const level = _.get(world, vars.level);
  const {time} = _.get(world, vars.stats);
  const slow = time >= level.time - level.slowGrowth;
  const expand = die(world.random, slow ? 32 : 4);
  const oversized = size >= 200;
  const area = _.filter(function([id, {positioned}]){
    return _.detect(room(world), around(positioned, true));
  }, entities);
  const suffocated = !_.seq(area);
  return suffocated || oversized ? suffocate(world, entities, oversized ? boulder : diamond) : expand() ? grow(world, area) : world;
}

function extraLife(world){
  return _.chain(world,
    world.db["extra-life"] ? _.comp(_.assocIn(_, [vars.cues, "extra-life"], true), _.updateIn(_, [vars.stats, "lives"], _.inc), w.sets(["extra-life"], false)) : _.identity);
}

const $keys = dom.depressed(document.body);
const $inputs = $.map(function(keys){
  return {keys};
}, $keys);
const inputs = _.partial(_.deref, $inputs);
$.sub($inputs, _.noop); //without subscribers, won't activate

function blank(){
  return _.chain(
    w.world(["gravitated", "seeking", "controlled", "growing", "falling", "rolling", "exploding", "becoming", "transitioning", "residue"], _.chance(seed).random),
    w.via("positioned"),
    w.install(["extra-life"], false, _.plug(r.modified, _, {path: ["score"], props: ["score"]}), function(id, {triggered: {compared: [curr, prior]}}){
      const goal = 500;
      return id === vars.stats && curr >= goal && (prior || 0) < goal ? _.constantly(true) : _.identity;
    }),
    enchantment());
}

function boot(data, l){
  const {levels} = data;
  const lvl = _.get(levels, l - 1);
  const {difficulty} = lvl;
  const level = _.absorb(lvl, _.get(difficulty, d - 2, {}));
  return _.merge(data, {level});
}

const $director = $.atom(boot({levels, status: "idle", $stage: $.atom(r.reel(blank()))}, l));

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

function reboot(data){
  const {$anim, unsub} = data;
  const status = "rebooted";
  unsub();
  pause($anim); //possibly restarting a level?
  return _.merge(data, {status});
}

function start(data, init = false){
  const {$stage, level} = data;
  const {size, cave, title, hint, time, diamonds} = level;
  const [width, height] = size;
  const playback = dispenser(play, pause);
  const status = "loaded";
  const ready = false;
  const finished = false;
  const collected = 0;
  const stats = init ? {score: 0, lives: 3} : _.chain($stage, _.deref, _.deref, _.get(_, vars.stats), _.selectKeys(_, ["score", "lives"]))

  const $changed = $.map(w.changed, $stage);
  const $change = $.atom(null);
  const $anim = animated(function({time, ticks, delta}){
    const inputs = _.deref($inputs);
    $.swap($stage,
      _.fmap(_,
        _.pipe(
          w.system(grows, ["growing"]),
          w.system(transitions, ["transitioning"]),
          w.system(becomes, ["becoming"]),
          w.system(settles, ["residue"]),
          w.system(explodes, ["exploding"]),
          w.system(extraLife),
          w.system(abort(inputs), ["controlled"]),
          w.system(control(inputs), ["controlled"]),
          w.system(seeks, ["seeking"]),
          w.system(falls, ["falling"]),
          w.system(rolls, ["rolling"]),
          w.system(gravity),
          w.system(countdown(ticks)))));
  }, 1000 / fps);

  const map = _.chain(blank(),
    r.reel,
    _.fmap(_,
      _.comp(
        vacancies,
        norandom ? _.identity : randomize,
        load(level.map),
        _.assoc(_, vars.level, level),
        _.assoc(_, vars.cues, {}),
        _.assoc(_, vars.stats, _.merge(stats, diamonds, {time, ready, finished, collected})))));

  const s = subs($.sub);

  s.sub($change, on(vars.cues, "extra-life"), function(){
    dom.addClass(document.body, "extra-life");
  });

  s.sub($change, on(vars.cues, "end"), function(){
    $.swap($director, end);
  });

  s.sub($change, on(vars.cues, "reboot"), function(){
    $.swap($director, reboot);
  });

  s.sub($change, on("positioned"), function({id, props: {positioned}, compared: [curr]}){
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

  s.sub($change, on(vars.R, "positioned"), function({touched, props: {positioned}}){
    if (positioned === "added"){
      a.play(sounds.crack);
    }
  });

  s.sub($change, on("growing"), function({touched, props: {growing}, reel}){
    if (growing === "added"){
      a.play(sounds.amoeba, true);
    } else if (growing === "removed") {
      const world = r.current(reel);
      if (!_.seq(world.db.components.growing)){
        a.pause(sounds.amoeba);
      }
    }
  });

  s.sub($change, on(vars.stats, "collected"), function({props: {collected}}){
    if (collected === "updated"){
      a.play(sounds.collected);
    }
  });

  s.sub($change, on(vars.stats, "finished"), function({props: {finished}}){
    if (finished === "updated"){
      a.play(sounds.finished);
    }
  });

  s.sub($change, on(vars.stats, "time"), function({props: {time}, compared: [curr], reel}){
    if (time === "updated" && curr.time < 10 && curr.time > 0 && !_.chain(reel, r.current, _.getIn(_, [vars.stats, "finished"]))) {
      a.play(sounds.timeout);
    }
  });

  $.eachkv(function(key, digits){
    s.sub($change, on(vars.stats, key), function({compared: [curr]}){
      dom.html(dom.sel1(`#${key}`), _.map(function(char){
        return span({"data-char": char});
      }, _.lpad(_.get(curr, key), digits, 0)));
    });
  }, {needed: 2, worth: 2, extras: 2, collected: 2, time: 3, score: 6});

  s.sub($change, on(vars.stats, "lives"), function({compared: [curr]}){
    const {lives} = curr;
    dom.attr(dom.sel1(`#stats`), "data-lives", lives);
    dom.html(dom.sel1(`#lives`), [span({"data-char": lives}), span({"data-char": "life"})]);
  });

  s.sub($change, on("facing"), function({id, props: {facing}, compared: [curr]}){
    _.maybe(document.getElementById(id),
      _.includes(["added", "updated"], facing) ?
        dom.attr(_, "data-facing", curr.facing) :
        dom.removeAttr(_, "data-facing"));
  });

  s.sub($change, on("falling"), function({id, props: {falling}}){
    if (falling == "removed") {
      a.play(sounds.stone);
    }
    _.maybe(document.getElementById(id),
      _.includes(["added"], falling) ?
        dom.addClass(_, "falling") :
        dom.removeClass(_, "falling"));
  });

  s.sub($change, on("rolling"), function({id, props: {rolling}}){
    _.maybe(document.getElementById(id),
      _.includes(["added"], rolling) ?
        dom.addClass(_, "rolling") :
        dom.removeClass(_, "rolling"));
  });

  s.sub($change, on("exploding"), function({id, props: {exploding}}){
    _.maybe(document.getElementById(id),
      _.includes(["added"], exploding) ?
        dom.addClass(_, "exploding") :
        dom.removeClass(_, "exploding"));
  });

  s.sub($change, on(vars.enchantment, "status"), function({id, props: {status}, compared: [curr]}){
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

  s.sub($change, on(vars.exit, "portal"), function({id, props: {portal}, compared: [curr]}){
    _.maybe(document.body, dom.toggleClass(_, "portal", curr?.portal));
  });

  s.sub($change, on("moving"), function({id, props: {moving}, compared: [curr]}){
    _.maybe(document.getElementById(id),
      $.doto(_,
        dom.toggleClass(_, "idle", !curr?.moving),
        dom.toggleClass(_, "moving", !!curr?.moving)));
  });

  dom.html(el, null);
  $.reset($stage, map);
  s.sub($changed, $.each($.reset($change, _), _));

  dom.html(dom.sel1(`#title`), _.map(function(char){
    return span({"data-char": char});
  }, _.lowerCase(title)));
  dom.text(dom.sel1("title"), `Boulder Dash: ${title}`);

  dom.text(dom.sel1("#hint"), hint);
  dom.addStyle(el, "width", `${width * 32}px`)
  dom.addStyle(el, "height", `${height * 32}px`);
  dom.attr(el, "data-cave", _.lowerCase(cave));

  el.focus();

  const {unsub} = s;

  return _.merge(data, {unsub, $anim, $stage, playback, status});
}

function end(data){
  const {$anim} = data;
  pause($anim);
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
  const {level, levels, $anim} = data;
  const idx = _.indexOf(levels, level);
  pause($anim);
  return _.chain(data, _.plug(boot, _, idx + 2), start);
}

reg({$director, $inputs, vars, r, w, start, advance});

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
