import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {sound} from "./sound.js";
import {IAudible} from "./iaudible.js";

export function Sounds(queue){
  this.queue = queue;
}

export function sounds(...files){
  return new Sounds(_.cycle(_.mapa(sound, files)));
}

function play(sounds, loop = false){
  const sound = _.first(sounds.queue);
  sounds.queue = _.rest(sounds.queue);
  IAudible.play(sound, loop);
}

function pause(sounds){
  const sound = _.first(sounds.queue);
  IAudible.pause(sound);
}

$.doto(Sounds,
  _.implement(IAudible, {play, pause}));
