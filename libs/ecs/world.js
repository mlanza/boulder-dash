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

function World(entities, tags, views, inputs){
  this.entities = entities;
  this.tags = tags;
  this.views = views;
  this.inputs = inputs;
}

export function world(inputs, tags){
  return new World(pm.map([]),
    _.reduce(_.assoc(_, _, s.set([])), {}, tags),
    {},
    inputs);
}

function views1(self){
  return _.keys(self.views);
}

function views2(self, key){
  return _.getIn(self.views, [key, "model"]);
}

//must define views in advance of adding components
function views6(self, key, model, update, triggers = null){
  return new World(
    self.entities,
    self.tags,
    _.assoc(self.views, key, {
      model,
      update,
      triggers
    }),
    self.inputs);
}

export const views = _.overload(null, views1, views2, views6);

function project(id, comps, prior){ //project to views
  const components = _.toArray(comps);
  return function(self){
    const curr = self;
    return new World(
      self.entities,
      self.tags,
      _.reducekv(function(views, named, {triggers, update, model}){
        const triggered = triggers ? _.seq(_.intersection(triggers, components)) : true;
        return triggered ? _.assocIn(views, [named, "model"], update(model, id, _.get(curr, id), _.get(prior, id))) : views;
      }, self.views, self.views),
      self.inputs);
  }
}

function tag(id, prior){
  return function(self){
    const curr = self;
    const [ccc, ppp] = [_.get(curr, id, {}), _.get(prior, id, {})];
    const keys = _.union(s.set(_.keys(ccc) || []), s.set(_.keys(ppp) || []));
    return new World(
      self.entities,
      _.reduce(function(memo, key){
        const touched = r.touched(_.get(ccc, key), _.get(ppp, key));
        switch(touched){
          case "added":
            return _.update(memo, key, _.conj(_, id));
          case "removed":
            return _.update(memo, key, _.disj(_, id));
          default:
            return memo;
        }
      }, self.tags, keys),
      self.views,
      self.inputs);
  }
}

function lookup(self, id){
  return _.get(self.entities, id);
}

function assoc(self, id, entity){
  return _.chain(new World(entity == null ? _.dissoc(self.entities, id) : _.assoc(self.entities, id, entity), self.tags, self.views, self.inputs),
    tag(id, self),
    project(id, _.keys(entity), self));
}

function dissoc(self, id){
  const entity = _.get(self, id);
  return _.chain(new World(_.dissoc(self.entities, id), self.tags, self.views, self.inputs),
    tag(id, self),
    project(id, _.keys(entity), self));
}

function contains(self, id){
  return _.contains(self.entities, id);
}

function capture(self){
  return new World(self.entities,
    self.tags,
    _.updateIn(self.views, ["touched", "model"], _.empty),
    self.inputs);
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

export function tagged(tags, self){
  return _.chain(tags,
    _.mapa(_.get(self.tags, _), _),
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
