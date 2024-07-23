import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";
import dom from "./libs/atomic_/dom.js";
import {reg} from "./libs/cmd.js";
import w from "./libs/ecs_/world.js";
import p from "./libs/ecs_/itouchable.js";

const div = dom.tag("div");
const el = dom.sel1("#stage");
const R = w.uids();

const addNoun = w.addComponent("noun"),
      addDescribed = w.addComponent("described"),
      addPushable = w.addComponent("pushable"),
      addDiggable = w.addComponent("diggable"),
      addGravity = w.addComponent("gravity"),
      addLethal = w.addComponent("lethal"),
      addRounded = w.addComponent("rounded"),
      addSeeking = w.addComponent("seeking"),
      addCollected = w.addComponent("collected"),
      addExplosive = w.addComponent("explosive"),
      addPositioned = w.addComponent("positioned"),
      addControlled = w.addComponent("controlled");

function steelWall(coords){
  return _.pipe(
    w.addEntity(),
    addNoun("steel-wall"),
    addPositioned(coords));
}

function wall(coords){
  return _.pipe(
    w.addEntity(),
    addNoun("wall"),
    addExplosive(),
    addPositioned(coords));
}

function rockford(coords){
  return _.pipe(
    w.addEntity(R),
    addNoun("Rockford"),
    addControlled(_.map([
      ["ArrowUp", "up"],
      ["ArrowDown", "down"],
      ["ArrowLeft", "left"],
      ["ArrowRight", "right"]
    ])),
    addExplosive(),
    addPositioned(coords));
}

function diamond(coords){
  return _.pipe(
    w.addEntity(),
    addNoun("diamond"),
    addCollected(),
    addExplosive(),
    addRounded(),
    addPositioned(coords));
}

function dirt(coords){
  return _.pipe(
    w.addEntity(),
    addNoun("dirt"),
    addDiggable(),
    addExplosive(),
    addPositioned(coords));
}

function enemy(noun, direction){
  return function(coords){
    return _.pipe(
      w.addEntity(),
      addNoun(noun),
      addSeeking(direction),
      addExplosive(),
      addPositioned(coords));
  }
}

const firefly = enemy("firefly", "clockwise");
const butterfly = enemy("butterfly", "counterclockwise");

function boulder(coords){
  return _.pipe(
    w.addEntity(),
    addNoun("boulder"),
    addPushable(),
    addExplosive(),
    addRounded(),
    addGravity(1),
    addPositioned(coords));
}

const spawn = _.get({".": dirt, "r": rockford, "o": boulder, "w": wall, "s": steelWall, "d": diamond}, _, _.constantly(_.identity));

const board = `
wwwwwwwwww
w...oo.. w
w..oooo. w
wr...... w
wwwwwwwwww
`;

const blank = w.world(["noun", "pushable", "diggable", "rounded", "lethal", "seeking", "collected", "explosive", "gravity", "positioned", "controlled"]);

const load = _.pipe(
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
  _.spread(_.concat),
  _.reduce(function(memo, {coords, piece}){
    return _.chain(memo, piece(coords));
  }, blank, _));

const $state = $.atom(_.chain(board, load));
const $changed = $.map(_.pipe(w.changed, _.toArray), $state);
const $keys = $.atom(["ArrowUp", "ShiftKey"]); //dom.depressed(document.body);
const $positioned = $.atom(_.map([]));

reg({$state, $changed, $positioned, $keys});

const vertical = _.get({"up": -1, "down": 1}, _, 0);
const horizontal = _.get({"left": -1, "right": 1}, _, 0);

function at(coords){
  return _.get(_.deref($positioned), coords);
}

function nearby([x, y], key, offset = 1){
  return [x + horizontal(key) * offset, y + vertical(key) * offset];
}

function system(components, f){
  return function(world){
    return f(_.map(function(id){
      return [id, w.entity(world, id, components)];
    }, w.entities(world, components)), world);
  }
}

function control(entities, world){
  const key = _.chain($keys, _.deref, _.omit(_, "ShiftKey"), _.omit(_, "CtrlKey"), _.first);
  return key ? _.reduce(function(memo, [id, {positioned, controlled}]){
    const direction = _.get(controlled, key);
    const beyond = nearby(positioned, direction);
    const beyondId = at(beyond);
    const adjacent = w.entity(world, beyondId, ["diggable", "pushable", "positioned", "noun"]);
    return _.chain(memo,
      adjacent.diggable ? dig(beyondId) : adjacent.pushable ? push(beyondId, direction) : _.identity,
      move(id, direction));
  }, world, entities) : world;
}

function move(id, direction){
  return function(world){
    return world; //TODO
  };
}

function push(id, direction){
  return function(world){
    return world; //TODO
  };
}

function dig(id){
  return function(world){
    return w.removeEntity(world, id);
  }
}

$.sub($changed, _.filter(_.seq), function(changed){
  $.each(function({id, components, hist}){
    const {positioned} = components;
    switch(positioned){
      case "added": {
        const noun = _.chain(hist(id, "noun"), _.first);
        const [x, y] = _.chain(hist(id, "positioned"), _.first);
        $.swap($positioned, _.assoc(_, [x ,y], id));
        dom.append(el,
          $.doto(div({"data-noun": noun, id}),
            dom.attr(_, "data-x", x),
            dom.attr(_, "data-y", y)));
        break;
      }
      case "removed": {
        const coords = _.chain(hist(id, "positioned"), _.first);
        $.swap($positioned, _.dissoc(_, coords));
        _.maybe(document.getElementById(id), dom.omit(el, _));
        break;
      }
    }
  }, changed);
  $.swap($state, p.wipe);
});

$.swap($state, system(["positioned", "controlled"], control));
