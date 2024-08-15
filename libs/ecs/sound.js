import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import {IAudible} from "./iaudible.js";

export function Sound(audio){
  this.audio = audio;
}

export function sound(file){
  const audio = new Audio(file);
  audio.preload = true;
  return new Sound(audio);
}

function play(sound, loop = false){
  const audio = sound.audio;
  audio.loop = loop;
  audio.play();
}

function pause(sound){
  sound.audio.pause();
}

$.doto(Sound,
  _.implement(IAudible, {play, pause}));
