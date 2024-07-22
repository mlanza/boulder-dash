import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {touchMap, hist} from "./touch-map.js";
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

function entities1(self){
  return _.chain(self, _.get(_, "entities"), _.keys);
}

function entities2(self, ...components){
  return _.chain(components,
    _.map(function(type){
      return _.chain(self, _.getIn(_, ["components", type]), _.keys);
    }, _),
    _.spread(function(set, ...sets){
      return _.reduce(_.intersection, set, sets);
    }));
}

export const entities = _.overload(null, entities1, entities2);

export function removeEntities(self, ids){
  return new World(self.lastId,
    _.reduce(_.dissoc, self.entities, ids),
    _.reducekv(function(memo, key, map){
     return _.assoc(memo, key, _.reduce(_.dissoc, map, ids));
    }, {}, self.components));
}

export function entity2(self, id){
  return entity3(self, id, _.keys(_.get(self, "components")));
}

export function entity3(self, id, components){
  const value = _.getIn(self, ["entities", id]); //TODO make noniterable prop
  return _.reduce(function(memo, component){
    return _.assoc(memo, component, _.getIn(self, ["components", component, id]));
  }, {id, value}, components);
}

export const entity = _.overload(null, null, entity2, entity3);

function changed2(self, id){
  const [v, touched] = p.touched(self, id);
  const components = _.reducekv(function(memo, key, map){
    const [v, touched] = p.touched(map, id);
    return _.assoc(memo, key, touched);
   }, {}, self.components);
  return {id, touched, components, hist: _.partial(change, self)};
}

function changed1(self){
  return _.filter(function({touched, components}){
    return touched || _.notEq({}, components);
  }, _.map(_.partial(changed2, self), _.union(_.set(_.keys(self.entities.curr)), _.set(_.keys(self.entities.prior)))));
}

export const changed = _.overload(null, changed1, changed2);

function change2(world, id){
  return hist(_.get(world, "entities"), id);
}

function change3(world, id, component){
  return hist(_.getIn(world, ["components", component]), id);
}

const change = _.overload(null, null, change2, change3);
