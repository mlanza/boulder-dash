import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {touchMap} from "./touch-map.js";
import * as p from "./itouchable.js";
import {ITouchable} from "./itouchable.js";
export {wipe, touched} from "./itouchable.js";

function World(lastId, entities, components){
  this.lastId = lastId;
  this.entities = entities;
  this.components = components;
}

function wipe(self){
  return new World(
    null,
    p.wipe(self.entities),
    _.reducekv(function(memo, key, map){
      return _.assoc(memo, key, p.wipe(map));
    }, {}, self.components));
}

function touched1(self){
  return _.chain(self, _.get(_, "entities"), p.touched);
}

function touched2(self, id){
  return _.chain(self, _.get(_, "entities"), _.plug(p.touched, _, id));
}

const touched = _.overload(null, touched1, touched2);

$.doto(World,
  _.record,
  _.implement(ITouchable, {touched, wipe}));

export const any = _.constantly(true);

export function world(){
  return new World(null, touchMap(), {});
}

export function defComponent(type){
  return _.assocIn(_, ["components", type], touchMap([]));
}

const alt = _.chance(8675309);
export const uids = _.pipe(_.nullary(_.uids(5, alt.random)), _.str);

export function addEntity(identifier = uids, value = null){
  return function(self){
    const uid = identifier(value);
    return _.chain(self,
      _.assoc(_, "lastId", uid),
      _.assocIn(_, ["entities", uid], value));
  }
}

export const addComponent = _.curry(function(type, value, self){
  if (!_.getIn(self, ["components", type])) {
    throw new Error(`There are no ${type} components.`);
  }
  return _.assocIn(self, ["components", type, _.get(self, "lastId")], value == null ? true : value);
});

export function queryEntities(self, crit){
  return _.chain(crit,
    _.reducekv(function(memo, type, pred){
      const ids = _.chain(self,
        _.getIn(_, ["components", type]),
        pred ? p.touched : _.seq,
        _.filter(_.pipe(_.second, pred || any), _),
        _.mapa(_.first, _));
      return _.assoc(memo, type, ids);
    }, {}, _),
    _.vals,
    _.spread(function(set, ...sets){
      return _.reduce(_.intersection, set, sets);
    }));
}

export function removeEntities(self, ids){
  return new World(self.lastId,
    _.reduce(_.dissoc, self.entities, ids),
    _.reducekv(function(memo, key, map){
     return _.assoc(memo, key, _.reduce(_.dissoc, map, ids));
    }, {}, self.components));
}

export function getEntity(self, id, which = _.keys(_.get(self, "components"))){
  const touch = _.plug(p.touched, _, id);
  const components = _.reduce(function(memo, type){
    const value = _.getIn(self, ["components", type, id]);
    return _.assoc(memo, type, value);
  }, {}, which);
  const touched = _.reduce(function(memo, type){
    const [v, touched] = _.maybe(self, _.getIn(_, ["components", type]), touch) || [null, "n/a"];
    return _.assoc(memo, type, touched);
  }, {}, which);
  const [v, entity] = _.chain(self, touch);
  return {id, components, touched: _.merge(touched, {entity})};
}

export function getEntities(self, ids, which = _.keys(_.get(self, "components"))){
  return _.map(function(id){
    return getEntity(self, id, which);
  }, ids);
}

export function addEffects(self, effects){
  return _.update(self, "effects", _.conj(_, ...effects));
}

export const added = _.eq(_, "added");
export const removed = _.eq(_, "removed");
export const updated = _.eq(_, "updated");

export function effects(self){
  return self.effects;
}

function changed2(self, id){
  const [v, touched] = p.touched(self, id);
  const components = _.reducekv(function(memo, key, map){
    const [v, touched] = p.touched(map, id);
    return _.assoc(memo, key, touched);
   }, {}, self.components);
  return {id, touched, components, diff: _.partial(change, self)};
}

function changed1(self){
  return _.filter(function({touched, components}){
    return touched || _.notEq({}, components);
  }, _.map(_.partial(changed2, self), _.union(_.set(_.keys(self.entities.curr)), _.set(_.keys(self.entities.prior)))));
}

export const changed = _.overload(null, changed1, changed2);

function change2(world, id){
  const map = _.get(world, "entities");
  return _.mapa(_.get(_, id), [map.curr, map.prior]);
}

function change3(world, id, component){
  const map = _.getIn(world, ["components", component]);
  return _.mapa(_.get(_, id), [map?.curr, map?.prior]);
}

const change = _.overload(null, null, change2, change3);
