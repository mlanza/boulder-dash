import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {IAudible} from "./iaudible.js";

export function Sound(file){
  this.file = file;
  this.timer = null;
}

export function sound(file){
  return new Sound(file);
}

function play(sound, loop = false){
  const audio = sound.audio = new Audio(sound.file);
  audio.loop = loop;
  sound.timer || audio.play();
  clearTimeout(sound.timer);
  sound.timer = setTimeout(function(){
    sound.timer = null;
  }, 50);
}

function pause(sound){
  sound.audio?.pause();
}

$.doto(Sound,
  _.implement(IAudible, {play, pause}));
