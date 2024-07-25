import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as tm from "./touch-map.js";
import * as p from "./itouchable.js";
import {ITouchable, touched} from "./itouchable.js";
export {touched, wipe} from "./itouchable.js";

const alt = _.chance(8675309);
export const uids = _.pipe(_.nullary(_.uids(5, alt.random)), _.str);

function World(entities, tags, views){
  this.entities = entities;
  this.tags = tags;
  this.views = views;
}

export function world(tags){
  return new World(tm.touchMap(),
    _.reduce(function(memo, key){
      return _.assoc(memo, key, _.set([]));
    }, tm.touchMap({}), tags),
    tm.touchMap());
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
    return new World(
      self.entities,
      self.tags,
      _.reducekv(function(views, named, {triggers, update, model}){
        const triggered = _.seq(_.intersection(triggers, components));
        return triggered ? _.assocIn(views, [named, "model"], update(model, id, _.get(p.current(self), id, {}), _.get(p.prior(self), id, {}), prior)) : views;
      }, self.views, self.views));
  }
}

function tag(id, prior){
  return function(self){
    //TODO review
    const ccc = _.get(p.current(self), id) || {},
          ppp = _.get(p.current(prior), id) || {};
    const keys = _.union(_.set(_.keys(ccc)), _.set(_.keys(ppp)));
    return new World(
        self.entities,
    _.reduce(function(memo, key){
      //TODO review, used touched?
      const cc = _.get(ccc, key),
            pp = _.get(ppp, key);
      const touched = cc != null && pp == null ? "added" : pp != null && cc == null ? "removed" : _.eq(cc, pp) ? null : "updated";
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
    project(id, _.keys(self.tags), entity));
}

function dissoc(self, id){
  return _.chain(new World(_.dissoc(self.entities, id), self.tags, self.views),
    tag(id, self),
    project(id, _.keys(self.tags), self));
}

function contains(self, id){
  return _.contains(self.entities, id);
}

function current(self){
  return p.current(self.entities);
}

function prior(self){
  return p.prior(self.entities);
}

function wipe(self){
  const entities = p.wipe(self.entities),
        tags = p.wipe(self.tags),
        views = p.wipe(self.views);
  return tags === self.tags && entities === self.entities && views === self.views ? self : new World(entities, tags, views);
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
  _.implement(ITouchable, {current, prior, wipe})
  );

export function tagged(tags, self){
  return _.chain(tags,
    _.mapa(_.get(self.tags, _), _),
    _.spread(function(set, ...sets){
      return _.reduce(_.intersection, set, sets);
    }));
}

function changed2(self, id){
  const touched = p.touched(self, id);
  const components = _.reducekv(function(memo, key, map){
    return _.assoc(memo, key, p.touched(self, id, key));
   }, {}, self.tags);
  const compared = p.compared(self, id);
  return {id, touched, components, compared};
}

function changed1(self){
  return _.chain(self.entities, p.known, _.mapa(function(id){
    return changed2(self, id);
  }, _));
}

export const changed = _.overload(null, changed1, changed2);

export function patch(patch){
  return _.pipe(_.merge(_, patch), _.compact, _.blot);
}
