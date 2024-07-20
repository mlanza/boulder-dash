import _ from "./libs/atomic_/core.js";
import $ from "./libs/atomic_/shell.js";
import dom from "./libs/atomic_/dom.js";
import {reg} from "./libs/cmd.js";
import w from "./libs/ecs_/world.js";
import p from "./libs/ecs_/itouchable.js";

const div = dom.tag("div");
const el = dom.sel1("#stage");

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

const blank = _.chain(
  w.world(),
  w.defComponent("noun"),
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
const $positioned = $.atom(_.map([]));

reg({$state, $keys, $positioned});

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

function event(type){ //basic event (can be further enriched)
  return function({id, components, touched}){
    const details = _.merge({id, touched}, components);
    return {type, details};
  }
}

function dig(coords){
  return function(world){
    const ids = w.getEntities(world, {positioned: _.complement(w.removed)}, _.complement(w.removed));
    const dirt = _.detect(function({id, components}){
      const {positioned} = components;
      return _.eq(coords, positioned);
    }, w.getComponents(world, ["positioned"], ids));
    const id = dirt?.id;
    return w.removeEntities(world, [id]);
  }
}

function render(world){ //system
  return _.chain(
    w.getEntities(world, {positioned: null}, _.or(w.removed, w.added)),
    w.getComponents(world, ["positioned", "noun"], _),
    _.sort(_.asc(_.getIn(_, ["touched", "positioned"])), _.asc(_.getIn(_, ["components", "positioned", 1])), _.asc(_.getIn(_, ["components", "positioned", 0])), _),
    _.mapa(function({id, components, touched}){
      const {positioned, noun} = components;
      switch(touched.positioned){
        case "added":
          return {type: "render", details: {id, positioned, noun}};
        case "removed":
          return {type: "unrender", details: {id}};
      }
      throw new Error(`Unknown touch ${touch?.positioned}`);
    }, _),
    w.addEvents(world, _));
}

function reconcile({type, details}){
  $.log("reconciling", type, details);
  switch(type){
    case "unrender": {
      const {id} = details;
      $.swap($positioned, _.dissoc(_, id));
      _.maybe(document.getElementById(id), dom.omit(el, _));
      break;
    }

    case "render": {
      const {id, positioned, noun} = details;
      const [x, y] = positioned;
      $.swap($positioned, _.assoc(_, positioned, id));
      dom.append(el,
        $.doto(div({"data-noun": noun, id}),
          dom.attr(_, "data-x", x),
          dom.attr(_, "data-y", y)));
      break;
    }
  }
}

$.sub($state, _.map(w.events), $.each(reconcile, _))
$.swap($state, control);
$.swap($state, dig([1,2]));
$.swap($state, render);
