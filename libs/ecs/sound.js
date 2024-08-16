import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {IAudible} from "./iaudible.js";

export function Sound(file){
  this.file = file;
}

export function sound(file){
  return new Sound(file);
}

function play(sound, loop = false){
  const audio = sound.audio = new Audio(sound.file);
  audio.loop = loop;
  audio.play();
}

function pause(sound){
  sound.audio.pause();
}

$.doto(Sound,
  _.implement(IAudible, {play, pause}));
