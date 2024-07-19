import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {touchMap} from "./touch-map.js";
import * as p from "./itouchable.js";
import {ITouchable} from "./itouchable.js";
export {wipe, touched} from "./itouchable.js";

function Slate(lastid, entities, components){
  this.lastid = lastid;
  this.entities = entities;
  this.components = components;
}

function wipe(self){
  return new Slate(
    self.lastid,
    p.wipe(self.entities),
    _.reducekv(function(memo, key, map){
      return _.assoc(memo, key, p.wipe(map));
    }, {}, self.components));
}

$.doto(Slate,
  _.record,
  _.implement(ITouchable, {wipe}));

export function slate(){
  return new Slate(null, touchMap(), {});
}

export function defComponent(type){
  return _.assocIn(_, ["components", type], touchMap([]));
}

export function addEntity(identifier = _.pipe(_.nullary($.uid), _.str), value = null){
  return function(state){
    const uid = identifier(value);
    return _.chain(state,
      _.assoc(_, "lastid", uid),
      _.assocIn(_, ["entities", uid], value));
  }
}

export const addComponent = _.curry(function(type, value, state){
  if (!_.getIn(state, ["components", type])) {
    throw new Error(`There are no ${type} components.`);
  }
  return _.assocIn(state, ["components", type, _.get(state, "lastid")], value);
});
