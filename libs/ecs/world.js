import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import imm from "../atomic_/immutables.js";
import * as c from "./icapture.js";
import * as r from "./reel.js";
import * as sm from "./serial-map.js";
import * as ss from "./serial-set.js";
import * as pm from "./part-map.js";
import * as ps from "./part-set.js";
export {capture, frame} from "./icapture.js";

const s = ss;
const alt = _.chance(8675309);
export const uids = _.pipe(_.nullary(_.uids(5, alt.random)), _.str);

function World(entities, inputs, db, hooks){
  this.entities = entities;
  this.inputs = inputs;
  this.db = db;
  this.hooks = hooks;
}

export function world(inputs, tags){
  const touching = _.binary(_.conj);
  return _.chain(new World(
    pm.map([]),
    inputs,
    {},
    []),
    touched(),
    _.reduce(function(memo, tag){
      return component(tag)(memo);
    }, _, tags));
}

function lookup(self, id){
  return _.get(self.entities, id);
}

function assoc(self, id, entity){
  return _.chain(new World(entity == null ? _.dissoc(self.entities, id) : _.assoc(self.entities, id, entity), self.inputs, self.db, self.hooks),
    hooks(id, self));
}

function dissoc(self, id){
  const entity = _.get(self, id);
  return _.chain(new World(_.dissoc(self.entities, id), self.inputs, self.db, self.hooks),
    hooks(id, self));
}

function contains(self, id){
  return _.contains(self.entities, id);
}

function capture(self){
  return new World(self.entities,
    self.inputs,
    _.update(self.db, "touched", _.empty),
    self.hooks);
}

function keys(self){
  return _.keys(self.entities);
}

function seq(self){
  return _.seq(self.entities);
}

$.doto(World,
  _.implement(_.IMap, {keys, dissoc}),
  _.implement(_.ILookup, {lookup}),
  _.implement(_.IAssociative, {assoc, contains}),
  _.implement(_.ISeqable, {seq}),
  _.implement(c.ICapture, {capture})); //TODO implement frame

//concrete fns
function install(path, init, trigger, update){
  return function(self){
    return new World(
      self.entities,
      self.inputs,
      _.assocIn(self.db, path, init),
      _.conj(self.hooks, {path, trigger, update}));
  }
}

function hooks(id, prior){
  return function(self){
    const reel = r.edit(self, prior);
    return new World(
      self.entities,
      self.inputs,
      _.reduce(function(db, {path, trigger, update}){
        const triggered = trigger(id)(reel);
        return triggered ? _.updateIn(db, path, update(id, {reel, triggered})) : db;
      }, self.db, self.hooks),
      self.hooks);
  }
}

function touched(init = s.set([])){
  return install(["touched"], init, r.modified, function(id){
    return _.conj(_, id);
  });
}

function component(tag, init =  s.set([])){
  const props = _.assoc({}, tag, _.includes(["added", "removed"], _));
  const pattern = {props};
  return install(["components", tag], init, _.plug(r.modified, _, {props: [tag], pattern}), function(id, {triggered}){
    const {props} = triggered || {};
    const touched = _.get(props, tag);
    const f = touched === "added" ? _.conj : _.disj;
    return f(_, id);
  });
}

export function via(tag, init = sm.map([])){
  const props = _.assoc({}, tag, _.isSome);
  const pattern = {props};
  return install(["via", tag], init, _.plug(r.modified, _, {props: [tag], pattern}), function(id, {reel, triggered}){
    const touched = _.getIn(triggered || {}, ["props", tag]);
    if (!touched) {
      return _.identity;
    } else {
      const [curr, prior] = r.correlate(reel, _.getIn(_, [id, tag]));
      return _.pipe(
        _.includes(["removed", "updated"], touched) ? _.dissoc(_, prior) : _.identity,
        _.includes(["added", "updated"], touched) ? _.assoc(_, curr, id) : _.identity);
    }
  });
}

export function having(self, components){
  return _.chain(components,
    _.mapa(_.get(self.db.components, _), _),
    _.spread(function(set, ...sets){
      return _.reduce(_.intersection, set, sets);
    }));
}

export function patch(patch){
  return function(entity){
    const revised = _.chain(entity, _.merge(_, patch), _.compact, _.blot);
    return _.eq(entity, revised) ? entity : revised;
  }
}

export function bestow(...args){
  const fs = _.initial(args), xs = _.last(args);
  return _.map(_.juxt(_.identity, ...fs), xs);
}

function changed2(reel, ...path){
  const id = _.first(path);
  const compared = r.correlate(reel, _.getIn(_, path));
  const [curr, prior] = compared;
  const touched = r.correlate(reel, _.getIn(_, path), r.touched);
  const keys = path.length === 1 ? _.union(_.keys(curr), _.keys(prior)) : null;
  const components = touched ? _.reduce(function(memo, key){
    const touched = r.correlate(reel, _.getIn(_, [id, key]), r.touched);
    touched && $.assoc(memo, key, touched);
    return memo;
   }, {}, keys) : {};
  return {id, touched, components, compared};
}

function changed1(reel){
  return _.chain(reel, r.frame, function(world){
    return world.db.touched;
  }, _.mapa(_.partial(changed2, reel), _));
}

export const changed = _.overload(null, changed1, changed2);
