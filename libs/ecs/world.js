import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {touchMap} from "./touch-map.js";
import * as p from "./itouchable.js";
import {ITouchable} from "./itouchable.js";
export {wipe, touched} from "./itouchable.js";

function World(lastid, entities, components, events){
  this.lastid = lastid;
  this.entities = entities;
  this.components = components;
  this.events = events; //used to direct the stage, to tell the ui how to reconcile the world model
}

function wipe(self){
  return new World(
    null,
    p.wipe(self.entities),
    _.reducekv(function(memo, key, map){
      return _.assoc(memo, key, p.wipe(map));
    }, {}, self.components),
    []);
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
  return new World(null, touchMap(), {}, []);
}

export function defComponent(type){
  return _.assocIn(_, ["components", type], touchMap([]));
}

export function addEntity(identifier = _.pipe(_.nullary($.uid), _.str), value = null){
  return function(self){
    const uid = identifier(value);
    return _.chain(self,
      _.assoc(_, "lastid", uid),
      _.assocIn(_, ["entities", uid], value));
  }
}

export const addComponent = _.curry(function(type, value, self){
  if (!_.getIn(self, ["components", type])) {
    throw new Error(`There are no ${type} components.`);
  }
  return _.assocIn(self, ["components", type, _.get(self, "lastid")], value);
});

export function getEntities(self, crit, pred = any){
  return _.chain(crit,
    _.reducekv(function(memo, type, pred){
      const ids = _.chain(self,
        _.getIn(_, ["components", type]),
        p.touched,
        _.filter(_.pipe(_.second, pred || any), _),
        _.mapa(_.first, _));
      return _.assoc(memo, type, ids);
    }, {}, _),
    _.vals,
    _.spread(function(set, ...sets){
      return _.reduce(_.intersection, set, sets);
    }),
    _.filtera(_.pipe(_.partial(p.touched, self), pred), _));
}

export function removeEntities(self, ids){
  return new World(self.lastid,
    _.reduce(_.dissoc, self.entities, ids),
    _.reducekv(function(memo, key, map){
     return _.assoc(memo, key, _.reduce(_.dissoc, map, ids));
    }, {}, self.components),
    self.events);
}

export function getComponents(self, which, ids){
  return _.map(function(id){
    const touch = _.plug(p.touched, _, id);
    const components = _.reduce(function(memo, type){
      const value = _.getIn(self, ["components", type, id]);
      return _.assoc(memo, type, value);
    }, {}, which);
    const touched = _.reduce(function(memo, type){
      const touched = _.chain(self, _.getIn(_, ["components", type]), touch);
      return _.assoc(memo, type, touched);
    }, {}, which);
    const entity = _.chain(self, touch);
    return {id, components, touched: _.merge(touched, {entity})};
  }, ids);
}

export function addEvents(self, events){
  return _.update(self, "events", _.conj(_, ...events));
}

export const added = _.eq(_, "added");
export const removed = _.eq(_, "removed");
export const updated = _.eq(_, "updated");

export function events(self){
  return self.events;
}
