import _ from "./libs/atomic_/core.js";
import r from "./libs/ecs_/reel.js";
import w from "./libs/ecs_/world.js";

export const fps = 10;

export const vars = {
  R: "rockford",
  entrance: "entrance",
  stats: "stats",
  cues: "cues",
  enchantment: "enchantment",
  exit: "exit",
  level: "level"
}

export function init(norandom, random, level, stats){
  const ready = false;
  const finished = false;
  const collected = 0;
  const {diamonds, time} = level;

  return _.chain(
    blank(random),
    r.reel,
    _.fmap(_,
      _.comp(
        vacancies,
        norandom ? _.identity : randomize,
        load(level.map),
        _.assoc(_, vars.level, level),
        _.assoc(_, vars.cues, {}),
        _.assoc(_, vars.stats, _.merge(stats, diamonds, {time, ready, finished, collected})))));
}

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

function transform(entity){
  const {transitioning} = entity;
  if (transitioning) {
    const [tick, patch] = transitioning;
    return tick == null ? _.merge(entity, patch) : entity;
  } else {
    return entity;
  }
}

const spawn = _.get({".": dirt, "X": entrance, "P": exit, "q": firefly, "B": butterfly, "a": amoeba, "r": boulder, "w": wall, "m": magicWall, "W": steelWall, "d": diamond}, _, vacant);

export function blank(random){
  return _.chain(
    w.world(["gravitated", "seeking", "controlled", "growing", "falling", "rolling", "exploding", "becoming", "transitioning", "residue"], random()),
    w.via("positioned"),
    w.install(["extra-life"], false, _.plug(r.modified, _, {path: ["score"], props: ["score"]}), function(id, {triggered: {compared: [curr, prior]}}){
      const goal = 500;
      return id === vars.stats && prior != null && curr >= goal && prior < goal ? _.constantly(true) : _.identity;
    }),
    enchantment());
}

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

export function loop($inputs, update){
  return function({time, ticks, delta}){
    const inputs = _.deref($inputs);
    update(
      _.fmap(_,
        _.pipe(
          w.system(transitions, ["transitioning"]),
          w.system(becomes, ["becoming"]),
          w.system(grows, ["growing"]),
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
  }
}

function scan([x,y]){
  return _.braid(_.array, _.range(x), _.range(y));
}

function randomize(world){
  const {randoms, size} = _.get(world, vars.level);
  const {positioned} = _.get(world, vars.entrance);
  const untouched = _.sset(_.toArray(around(positioned)));
  const noFreefall = _.pipe(_.plug(locate, world, _, "down"), _.get(_, "id"));
  function dontDropRocks(position){
    const above = locate(world, position, "up");
    return above?.noun !== "boulder";
  }
  function noAdjacentRocks(positioned){
    return !_.detect(function(positioned){
      return locate(world, positioned)?.entity?.noun === "boulder";
    }, around(positioned, false));
  }
  function fewWalls(positioned){
    const hits = _.chain(around(positioned), _.map(locate(world), _), _.filter(function(part){
      return _.includes(["wall", "steel-wall", "magic-wall"], part?.entity?.noun);
    }, _), _.take(3, _));
    return _.count(hits) < 2;
  }
  const targets = {
    "vacant": {target: ["dirt", "boulder"], what: vacant, valid: dontDropRocks},
    "boulder": {target: ["dirt"], what: boulder, valid: _.and(noFreefall, noAdjacentRocks, fewWalls)},
    "diamond": {target: [undefined, "dirt", "boulder"], what: diamond},
    "wall": {target: ["boulder"], what: wall},
    "firefly": {target: [undefined, "dirt", "boulder"], what: firefly, valid: dontDropRocks}
  }
  return _.chain(size,
    scan,
    _.shuffle(world.random, _), //don't process map in order
    _.map(locate(world), _),
    _.filter(function(x){
      return !x.entity?.indestructible && !_.includes(untouched, x.positioned);
    }, _),
    _.map(function(was){
      return _.reducekv(function({was, instead}, noun, [n, pool]){
        const d = die(world.random, n, pool);
        const {target, what, valid = _.constantly(true)} = _.get(targets, noun, {});
        return target && _.includes(target, was.entity?.noun) && valid(was.positioned) && d() ? _.reduced({was, instead: what}) : {was, instead};
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
  const advance = w.patch(_, vars.cues, {transitioning: [25, {advance: true}]});
  return function(world){
    const {exploding} = _.get(world, id);
    const there = locate(world, to);
    const portal = there.entity?.portal;
    const collision = !!there.id && !portal;
    return _.chain(world,
      portal ? _.comp(_.dissoc(_, there.id), advance, w.patch(_, id, {moving: false, indestructible, facing: null, controlled: null}), _.assocIn(_, [vars.stats, "finished"], true)) : _.identity,
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
  const intermission = _.getIn(world, [vars.level, "intermission"]);
  const die = _.updateIn(_, [vars.stats, "lives"], _.dec);
  const reboot = w.patch(_, vars.cues, {transitioning: [25, {reboot: true, transitioning: null}]});
  const end = w.patch(_, vars.cues, {transitioning: [25, {end: true, transitioning: null}]});
  const advance = w.patch(_, vars.cues, {transitioning: [25, {advance: true}]});
  return _.reduce(function(world, [id, {positioned, explosive, exploding}]){
    return exploding && positioned ? _.chain(world,
      explode(positioned, explosive, true),
      id === vars.R ? (intermission ? advance : _.comp(_.getIn(world, [vars.stats, "lives"]) == 1 ? end : reboot, die)) : _.identity,
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
    world.db["extra-life"] ? _.comp(
      _.assocIn(_, [vars.cues, "extra-life"], true),
      _.updateIn(_, [vars.stats, "lives"], _.inc),
      w.sets(["extra-life"], false)) : _.identity);
}
