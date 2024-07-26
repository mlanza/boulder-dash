import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as p from "./itouchable.js";
export {captured} from "./icaptured.js";
import * as c from "./icaptured.js";
import * as r from "./reel.js";


const alt = _.chance(8675309);
export const uids = _.pipe(_.nullary(_.uids(5, alt.random)), _.str);

function World(entities, tags, views){
  this.entities = entities;
  this.tags = tags;
  this.views = views;
}

export function world(tags){
  return new World(_.map([]),
    _.reduce(_.assoc(_, _, _.set([])), {}, tags),
    {});
}

function views1(self){
  return _.keys(self.views);
}

function views2(self, key){
  return _.getIn(self.views, [key, "model"]);
}

//must define views in advance of adding components
function views6(self, key, model, update, triggers){
  return new World(
    self.entities,
    self.tags,
    _.assoc(self.views, key, {
      model,
      update,
      triggers
    }));
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
        const triggered = _.seq(_.intersection(triggers, components));
        return triggered ? _.assocIn(views, [named, "model"], update(model, id, _.get(curr, id, {}), _.get(prior, id, {}))) : views;
      }, self.views, self.views));
  }
}

function tag(id, prior){
  return function(self){
    const curr = self;
    const [ccc, ppp] = [_.get(curr, id, {}), _.get(prior, id, {})];
    const keys = _.union(_.set(_.keys(ccc) || []), _.set(_.keys(ppp) || []));
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
      self.views);
  }
}

function lookup(self, id){
  return _.get(self.entities, id);
}

function assoc(self, id, entity){
  return _.chain(new World(entity == null ? _.dissoc(self.entities, id) : _.assoc(self.entities, id, entity), self.tags, self.views),
    tag(id, self),
    project(id, _.keys(self.tags), self));
}

function dissoc(self, id){
  return _.chain(new World(_.dissoc(self.entities, id), self.tags, self.views),
    tag(id, self),
    project(id, _.keys(self.tags), self));
}

function contains(self, id){
  return _.contains(self.entities, id);
}

//TODO save last-touched
function captured(self){
  return self;
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
  _.implement(c.ICaptured, {captured})); //TODO remove wipe

export function tagged(tags, self){
  return _.chain(tags,
    _.mapa(_.get(self.tags, _), _),
    _.spread(function(set, ...sets){
      return _.reduce(_.intersection, set, sets);
    }));
}

export function patch(patch){
  return _.pipe(_.merge(_, patch), _.compact, _.blot);
}

export function also(...fs){
  return _.map(_.juxt(_.identity, ...fs), _);
}
