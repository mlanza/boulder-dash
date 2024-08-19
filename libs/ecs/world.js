import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as c from "./icapture.js";
import * as r from "./reel.js";
export {capture, frame} from "./icapture.js";

function World(entities, random, db, hooks){
  this.entities = entities;
  this.random = random;
  this.db = db;
  this.hooks = hooks;
}

export function world(indices, random = Math.random){
  const touching = _.binary(_.conj);
  return _.chain(new World(
    _.pmap([]),
    random,
    {},
    []),
    install(["components", "touched"], _.sset([]), r.modified, function(id){
      return _.conj(_, id);
    }),
    _.reduce(function(memo, prop){
      return has(prop)(memo);
    }, _, indices));
}

function lookup(self, id){
  return _.get(self.entities, id);
}

function assoc(self, id, entity){
  return _.chain(new World(entity == null ? _.dissoc(self.entities, id) : _.assoc(self.entities, id, entity), self.random, self.db, self.hooks),
    hooks(id, self));
}

function dissoc(self, id){
  const entity = _.get(self, id);
  return _.chain(new World(_.dissoc(self.entities, id), self.random, self.db, self.hooks),
    hooks(id, self));
}

function contains(self, id){
  return _.contains(self.entities, id);
}

export function clear(path){
  return function(self){
    const curr = _.getIn(self.db, path);
    return _.seq(curr) ? new World(self.entities,
      self.random,
      _.updateIn(self.db, path, _.empty),
      self.hooks) : self;
  }
}

export function sets(path, value){
  return function(self){
    return new World(self.entities,
      self.random,
      _.assocIn(self.db, path, value),
      self.hooks);
  }
}

const capture = clear(["components", "touched"]);

function keys(self){
  return _.keys(self.entities);
}

function seq(self){
  return _.seq(self.entities);
}

function conj(self, entity){
  return assoc(self, uid(self), entity);
}

$.doto(World,
  _.implement(_.ICollection, {conj}),
  _.implement(_.IMap, {keys, dissoc}),
  _.implement(_.ILookup, {lookup}),
  _.implement(_.IAssociative, {assoc, contains}),
  _.implement(_.ISeqable, {seq}),
  _.implement(c.ICapture, {capture}));

//concrete fns
export function uid(world) {
  return _.uident(5, world.random);
}

export function install(path, init, trigger = _.constantly(_.constantly(null)), update = _.noop){
  return function(self){
    return new World(
      self.entities,
      self.random,
      _.assocIn(self.db, path, init),
      _.conj(self.hooks, {path, trigger, update}));
  }
}

function hooks(id, prior){
  return function(self){
    const reel = r.edit(self, prior);
    return new World(
      self.entities,
      self.random,
      _.reduce(function(db, {path, trigger, update}){
        const triggered = trigger(id)(reel);
        return triggered ? _.updateIn(db, path, update(id, {reel, triggered})) : db;
      }, self.db, self.hooks),
      self.hooks);
  }
}

function has(tag, init =  _.sset([])){
  const props = _.assoc({}, tag, _.includes(["added", "removed"], _));
  const pattern = {props};
  return install(["components", tag], init, _.plug(r.modified, _, {props: [tag], pattern}), function(id, {triggered}){
    const {props} = triggered || {};
    const touched = _.get(props, tag);
    const f = touched === "added" ? _.conj : _.disj;
    return f(_, id);
  });
}

export function via(tag, init = _.smap([])){
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
  const entity = _.get(world, id);
  return !entity || _.where(entity, patch) ? world : _.update(world, id, patch1(patch));
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
    return f(world, augment(_.get(world, _), having(world, components)));
  }
}
