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

function World(entities, db, hooks){
  this.entities = entities;
  this.db = db;
  this.hooks = hooks;
}

export function world(indices){
  const touching = _.binary(_.conj);
  return _.chain(new World(
    pm.map([]),
    {},
    []),
    install(["components", "touched"], s.set([]), r.modified, function(id){
      return _.conj(_, id);
    }),
    install(["components", "last-touched"], s.set([])),
    _.reduce(function(memo, prop){
      return has(prop)(memo);
    }, _, indices));
}

function lookup(self, id){
  return _.get(self.entities, id);
}

function assoc(self, id, entity){
  return _.chain(new World(entity == null ? _.dissoc(self.entities, id) : _.assoc(self.entities, id, entity), self.db, self.hooks),
    hooks(id, self));
}

function dissoc(self, id){
  const entity = _.get(self, id);
  return _.chain(new World(_.dissoc(self.entities, id), self.db, self.hooks),
    hooks(id, self));
}

function contains(self, id){
  return _.contains(self.entities, id);
}

export function clear(path){
  return function(self){
    const curr = _.getIn(self.db, path);
    return _.seq(curr) ? new World(self.entities,
      _.updateIn(self.db, path, _.empty),
      self.hooks) : self;
  }
}

function sets(path, value){
  return function(self){
    return new World(self.entities,
      _.assocIn(self.db, path, value),
      self.hooks);
  }
}

function track(key){
  return function(self){
    const was = _.getIn(self.db, ["components", key]);
    return _.chain(self,
      sets(["components", `last-${key}`], was),
      clear(["components", key]));
  }
}

const capture = track("touched");

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
export function install(path, init, trigger = _.constantly(_.constantly(null)), update = _.noop){
  return function(self){
    return new World(
      self.entities,
      _.assocIn(self.db, path, init),
      _.conj(self.hooks, {path, trigger, update}));
  }
}

function hooks(id, prior){
  return function(self){
    const reel = r.edit(self, prior);
    return new World(
      self.entities,
      _.reduce(function(db, {path, trigger, update}){
        const triggered = trigger(id)(reel);
        return triggered ? _.updateIn(db, path, update(id, {reel, triggered})) : db;
      }, self.db, self.hooks),
      self.hooks);
  }
}

function has(tag, init =  s.set([])){
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

function patch1(patch){
  return function(entity){
    return _.where(entity, patch) ? entity : _.chain(entity, _.merge(_, patch), _.compact, _.blot);
  }
}

function patch3(world, id, patch){
  return _.where(_.get(world, id), patch) ? world : _.update(world, id, patch1(patch));
}

export const patch = _.overload(null, patch1, null, patch3);

function changed2(reel, id, options = {}){
  return _.plug(r.modified, id, options)(reel);
}

function changed1(reel){
  return _.chain(reel, r.frame, world => world.db.components.touched, _.mapa(_.partial(changed2, reel), _));
}

export const changed = _.overload(null, changed1, changed2);

export function augment(...args){
  const fs = _.initial(args), xs = _.last(args);
  return _.map(_.juxt(_.identity, ...fs), xs);
}

export function system(f, components = []){
  return function(world){
    return f(augment(_.get(world, _), having(world, components)), world);
  }
}
