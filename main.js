import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";
import dom from "./libs/atomic_/dom.js";
import {reg} from "./libs/cmd.js";
import w from "./libs/ecs_/world.js";
import p from "./libs/ecs_/itouchable.js";

const div = dom.tag("div");
const el = dom.sel1("#stage");
const R = w.uids();

const explosive = true,
      collected = true,
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
  return _.assoc(_, w.uids(), {noun: "diamond", collected, explosive, rounded, positioned});
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

const spawn = _.get({".": dirt, "r": rockford, "o": boulder, "w": wall, "s": steelWall, "d": diamond}, _, _.constantly(_.identity));

const board = `
wwwwwwwwww
w...oo.. w
w..oooo. w
wr...... w
wwwwwwwwww
`;

function positioning(model, id, curr, prior){
  if (curr.positioned && !prior.positioned) { //added
    return _.assoc(model, curr.positioned, id);
  } else if (prior.positioned && !curr.positioned) { //removed
    return _.dissoc(model, prior.positioned);
  } else {
    return _.chain(model,
      _.dissoc(_, prior.positioned),
      _.assoc(_, curr.positioned, id));
  }
}

function load(board){
  $.log("load")
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
    return f(_.map(function(id){
      return [id, _.get(world, id)];
    }, w.tagged(components, world)), world);
  }
}

function control(entities, world){
  const keys = _.chain($keys, _.deref, _.omit(_, "ShiftKey"), _.omit(_, "CtrlKey"), _.seq);
  const stationary = _.chain($keys, _.deref, _.includes(_, "ShiftKey"));
  return keys ? _.reduce(function(memo, [id, {positioned, controlled}]){
    const direction = _.some(_.get(controlled, _), keys);
    const beyond = nearby(positioned, direction);
    const positioning = w.views(world, "positioning");
    const beyondId = _.get(positioning, beyond);
    const {diggable, pushable} = _.get(world, beyondId) || {};
    return _.chain(memo,
      diggable ? dig(beyondId) : pushable ? push(beyondId, beyond) : _.identity,
      stationary ? _.identity : move(id, beyond));
  }, world, entities) : world;
}


function move(id, positioned){
  return function(world){
    const positioning = w.views(world, "positioning");
    const there = _.get(positioning, positioned);
    const collision = !!there; //TODO handle collision
    return collision ? world : _.update(world, id, w.patch({positioned}));
  };
}

function push(id, positioned){
  return function(world){
    const positioning = w.views(world, "positioning");
    const occupied = _.get(positioning, positioned);
    return occupied ? world : _.update(world, id, w.patch({positioned}));
  };
}

function dig(id){
  return function(world){
    return _.dissoc(world, id);
  }
}

function changed(world){
  return _.chain(world, w.known, _.mapa(function(id){
    return w.changed(world, id);
  }, _));
}

const blank = _.chain(
  w.world(["noun", "pushable", "diggable", "rounded", "lethal", "seeking", "collected", "explosive", "gravity", "positioned", "controlled"]),
  w.views(_, "positioning", _.map([]), positioning, ["positioned"]));

const $state = $.atom(blank);
const $changed = $.map(changed, $state);
const $keys = dom.depressed(document.body);

reg({$state, $keys, $changed, w, p});

$.sub($changed, _.filter(_.seq), function(changed){
  $.each(function({id, components, compared}){
    const [curr, prior] = compared;
    const {positioned} = components;
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
  $.swap($state, p.wipe);
});

$.on(document, "keydown", function(e){
  if (_.includes(["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft"], e.key)) {
    e.preventDefault(); //to prevent moving the page around
  }
});

$.swap($state, load(board));

setInterval(function(){
  $.swap($state, system(["positioned", "controlled"], control));
  $.swap($state, p.wipe);
}, 100);

//TODO
function also(f, xs){
  return _.map(function(x){
    const result = f(x);
    return [x, result];
  }, xs);
}

