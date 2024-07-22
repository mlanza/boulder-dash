import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as tm from "./touch-map.js";
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

function selects(manner){
  function entity2(self, id){
    return entity4(self, id, _.keys(_.get(self, "components")));
  }

  function entity4(self, id, components){
    return _.reduce(function(memo, component){
      return _.chain(self,
        _.getIn(_, ["components", component]),
        manner,
        _.get(_, id),
        _.assoc(memo, component, _));
    }, {id}, components);
  }

  return _.overload(null, null, entity2, entity4);
}

export const current = selects(tm.current);
export const prior = selects(tm.prior);
export const entity = current;

export function known(self){
  return _.union(_.set(_.keys(self.entities.curr)), _.set(_.keys(self.entities.prior)));
}

$.doto(World,
  _.record,
  _.implement(ITouchable, {touched, wipe}));

export const any = _.constantly(true);

export function world(){
  return new World(null, tm.touchMap(), {});
}

export function defComponent(type){
  return _.assocIn(_, ["components", type], tm.touchMap([]));
}

const alt = _.chance(8675309);
export const uids = _.pipe(_.nullary(_.uids(5, alt.random)), _.str);

export function addEntity(uid = uids()){
  return function(self){
    return _.chain(self,
      _.assoc(_, "lastId", uid),
      _.assocIn(_, ["entities", uid], null));
  }
}

export function updateEntity(uid){
  return function(self){
    if (!_.contains(_.get(self, "entities"), uid)) {
      throw new Error(`Cannot update unknown entity ${uid}`);
    }
    return _.assoc(self, "lastId", uid);
  }
}

export function removeEntity(self, ...ids){
  return new World(null,
    _.reduce(_.dissoc, self.entities, ids),
    _.reducekv(function(memo, key, map){
     return _.assoc(memo, key, _.reduce(_.dissoc, map, ids));
    }, {}, self.components));
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

function changed2(self, id){
  const touched = p.touched(self, id);
  const components = _.reducekv(function(memo, key, map){
    return _.assoc(memo, key, p.touched(map, id));
   }, {}, self.components);
  return {id, touched, components, hist: _.partial(change, self)};
}

function changed1(self){
  return _.filter(function({touched, components}){
    return touched || _.notEq({}, components);
  }, _.map(_.partial(changed2, self), known(self)));
}

export const changed = _.overload(null, changed1, changed2);

function change(world, id, component){
  return tm.hist(_.getIn(world, ["components", component]), id);
}
