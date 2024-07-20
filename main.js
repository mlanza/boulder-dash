import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";
import dom from "./libs/atomic_/dom.js";
import {reg} from "./libs/cmd.js";
import w from "./libs/ecs_/world.js";

const div = dom.tag("div");
const el = dom.sel1("#stage");

const addNoun = w.addComponent("nouns"),
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

const blank = _.chain(
  w.world(),
  w.defComponent("nouns"),
  w.defComponent("pushable"),
  w.defComponent("diggable"),
  w.defComponent("rounded"),
  w.defComponent("lethal"),
  w.defComponent("seeking"),
  w.defComponent("collected"),
  w.defComponent("explosive"),
  w.defComponent("gravity"),
  w.defComponent("positioned"),
  w.defComponent("controlled"));

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
    w.addEntity(),
    addNoun("Rockford"),
    addControlled({
      up: ["ArrowUp"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      right: ["ArrowRight"]
    }),
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

const adds = _.get({".": dirt, "r": rockford, "o": boulder, "w": wall, "s": steelWall, "d": diamond}, _, _.constantly(_.identity));

const board = `
wwwwwwwwww
w...oo.. w
w..oooo. w
wr...... w
wwwwwwwwww
`;

const load = _.pipe(
  _.split(_, "\n"),
  _.map(_.trim, _),
  _.filter(_.seq, _),
  _.mapIndexed(function(row, chars){
    return _.mapIndexed(function(col, char){
      const coords = [col, row],
            piece = adds(char);
      return {coords, piece};
    }, _.seq(chars));
  }, _),
  _.spread(_.concat),
  _.reduce(function(memo, {coords, piece}){
    return _.chain(memo, piece(coords));
  }, blank, _));

const $state = $.atom(_.chain(board, load));
const $keys = $.atom(["ArrowRight"]); //dom.depressed(document.body);

reg({$state, $keys});

function control(world){
  const keys = _.seq(_.deref($keys));
  if (keys){
    const controlled = _.chain(
      w.getEntities(world, {positioned: null, controlled: null}),
      w.getComponents(world, ["positioned", "controlled"], _),
      _.toArray);
    return world;
  } else {
    return world;
  }
}

function render(world){ //system
  const type = "render";
  const ids = w.getEntities(world, {positioned: w.added});
  const events = _.chain(
    w.getComponents(world, ["positioned", "nouns"], ids),
    _.sort(_.asc(_.getIn(_, ["components", "positioned", 1])), _.asc(_.getIn(_, ["components", "positioned", 0])), _),
    _.mapa(function({id, components}){
      const details = _.merge({id}, components);
      return {type, details};
    }, _));
  return w.addEvents(world, events);
}

function reconcile({type, details}){
  switch(type){
    case "render":
      const {id, positioned, nouns} = details;
      const [x, y] = positioned;
      dom.append(el,
        $.doto(div({"data-what": nouns, id}),
          dom.addStyle(_, "top", `${32 * y}px`),
          dom.addStyle(_, "left", `${32 * x}px`)));
      break;
  }
}

$.sub($state, _.map(w.events), $.each(reconcile, _))

$.swap($state, render);
$.swap($state, control);
