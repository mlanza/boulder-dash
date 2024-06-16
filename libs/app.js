import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";
import dom from "./atomic_/dom.js";
import {reg} from "./cmd.js";

const stage = dom.sel1("#stage");
const ctx = stage.getContext('2d');
const dim = 32;

const working = document.createElement('canvas');
const tmp = working.getContext('2d',{ willReadFrequently: true });

function load(src){
  return new Promise(function(resolve, reject){
    const img = new Image();
    img.onload = function(){
      resolve(img);
    }
    img.src = src;
  });
}

const sprites = await load('../images/sprites.png');
const black = { r: 0, g: 0, b: 0, a: 255 };
const gray = { r: 63, g: 63, b: 63, a: 255 };
const brown = { r: 156, g: 101, b: 63, a: 255 };
const transparent = { r: 0, g: 0, b: 0, a: 0 };
const purple = { r: 176, g: 68, b: 234, a: 255 };

const img = _.partly(function img(col, row, {recoloring = [[black, transparent], [gray, brown]]} = {}){ //select original image
  tmp.drawImage(sprites, col * dim, row * dim, dim, dim, 0, 0, dim, dim);
  const imageData = tmp.getImageData(0, 0, dim, dim);
  const {data} = imageData;
  for(const [orig, alt] of recoloring) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === orig.r && data[i + 1] === orig.g && data[i + 2] === orig.b && data[i + 3] === orig.a) {
        data[i] = alt.r;
        data[i + 1] = alt.g;
        data[i + 2] = alt.b;
        data[i + 3] = alt.a;
      }
    }
  }
  return function(x, y){ //position at
    ctx.putImageData(imageData, y * dim, x * dim);
  }
});

function char(row){ //select original image
  return function(x, y, color = "yellow"){ //position at
    const img = new Image(dim, dim);
    img.onload = function() {
       ctx.drawImage(img, (color == "white" ? 8 : 9) * dim, row * dim / 2, dim, dim / 2, x * dim, y * dim / 2, dim, dim / 2);
    };
    img.src = '../images/sprites.png';
    return img;
  }
}

const rockford1 = img(0, 0);
const rockford2 = img(0, 1);
const explode1 = img(1, 0);
const explode2 = img(2, 0);
const explode3 = img(3, 0);
const numbers = _.map(char, _.range(16, 16 + 10));
const letters = _.mapa(char, _.range(33, 33 + 26));
const lefts = _.mapa(img(_, 4), _.range(8));
const rights = _.mapa(img(_, 5), _.range(8));
const amoebas = _.mapa(img(_, 8), _.range(8));
const images = [rockford1, rockford2, explode1, explode2, explode3, ...amoebas, ...lefts, ...rights];
const positions = _.map(_.array, _.repeat(0), _.range(26));

let xs = _.seq(images);
$.each(function([x, y]){
  const img = _.first(xs);
  img && img(x, y);
  xs = _.next(xs);
}, positions);

/*
explode1(1, 0);
explode2(2, 0);
explode3(3, 0);
*/







