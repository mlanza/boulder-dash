export default [{
  cave: "A",
  title: "Intro",
  hint: "Pick up jewels and exit before time is up.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 12, worth: 10, extras: 15},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    W...... ..d.r .....r.r....... ....r....W
    W.rXr...... .........rd..r.... ..... ..W
    W.......... ..r.....r.r..r........r....W
    Wr.rr.........r......r..r....r...r.....W
    Wr. r......... r..r........r......r.rr.W
    W... ..r........r.....r. r........r.rr.W
    Wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww...r..r.W
    W. ...r..d. ..r.r..........d.rd...... .W
    W..d.....r..... ........rr r..r....r...W
    W...r..r.r..............r .r..r........W
    W.r.....r........rrr.......r.. .d....r.W
    W.d.. ..r.  .....r.rd..d....r...r..d. .W
    W. r..............r r..r........d.....rW
    W........wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwW
    W r.........r...d....r.....r...r.......W
    W r......... r..r........r......r.rr..PW
    W. ..r........r.....r.  ....d...r.rr...W
    W....rd..r........r......r.rd......r...W
    W... ..r. ..r.rr.........r.rd...... ..rW
    W.d.... ..... ......... .r..r....r...r.W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "B",
  title: "Rooms",
  hint: "Pick up jewels, but you must move boulders to get all jewels.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 10, worth: 20, extras: 50},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    W.r..r..w.r...d.w... .r.wr......w..rr..W
    W.......w......rwrr. ...w ..d...w....r.W
    W                                      W
    Wd......w.r....rw.r. .. w..r..d.w..r.r.W
    W.......w.r....rw.r. r..w.....r.w... ..W
    Wwwwwwwwwwwwwwwwwwww wwwwwwwwwwwwwwwwwwW
    W....rr.w..r....w... ..rw....r..w.....rW
    W.......w.. ....w... ...w....r. w.....rW
    W                                      W
    Wr..r...w....r..w..r ...w......dwr.....W
    Wr....r.w..r..r.w... . rw.......wr...r.W
    W.r.....w...r...w... . rw.......w r..r.W
    Wwwwwwwwwwwwwwwwwwww wwwwwwwwwwwwwwwwwwW
    Wr.  q..w....r.rw... ...w.rd..r.w......W
    W.....r.wr......w..d ...w ..r...w.r.rr.W
    W                                      W
    Wd.. .r.wr....r.w.r. ..rw.r.r...w......W
    W.....r.wr..d...w... r..w..r....w...rr W
    W.d... rw..r....w.Xd r..w. .....w...rr W
    W.r.... w.. ..r.w.P. ...w....r.rw.... .W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "C",
  title: "Maze",
  hint: "Pick up jewels. You must get every jewel to exit.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 10, worth: 15, extras: 0},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    Wr.ww.wrr.w...rwr..r....w...r.....rw.d.W
    W..Xw.d.r.w...www..w.r....r..r.r...w.wrW
    W....w..rd..r....w.....r.wwr.......w.wwW
    Wd.w..wrwr..r....w...r......r.rr......wW
    Wr.w...w..r.ww..r.wwd.......r.rr......wW
    Wrr..r....w...r......r.rr......r..dww..W
    W..r.ww..r.rr...w....r.rr......w..r.w.rW
    W..w...d......d.r..wwr..r.w.wr..wr..d.rW
    Wr.r....w.ww..d.r..wwr..r..d.w...w..r.wW
    W.r.ww.....rrwr..d.w.wr..wr...wr..d.r..W
    Ww.ww......rrwr..r.w.ww...w..r.ww..r.wwW
    W.w.r.r.w...wwr..r....w...r.....ww.r.wwW
    W.w.r.r.w.d.w.wr..wr....r..r.rr....w...W
    Ww..wrwr..r....w...d...w.rw......w.ww.dW
    Ww...wwr..w.d...wr..r.r...r.wr......w..W
    Ww.d....r.ww..r.wwr.......r.wr......w..W
    W..r....w...r......r.rr......w..r.w...wW
    Wr.ww..r.ww...w....r.rr......w..rd..r..W
    Ww...r......r.rd......r...ww..wr..d.w..W
    Wrr...w.....r.rd......w..r.wd.d.rw.r...W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "D",
  title: "Butterflies",
  hint: "Drop boulders on butterflies to create jewels.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 10, worth: 5, extras: 20},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    WX.....r....................r........r.W
    W.....r..............r.................W
    W........r..r..........................W
    Wr.....................................W
    W...................r..................W
    W.r.....................r.........r....W
    W..r.....r...........r..r.............rW
    W......r......r.....................r..W
    W.......  B ..r.  B ....  B ....  B ...W
    W.......    ..r.    ....    ....    r..W
    W......................................W
    W...r..............................r...W
    W...r.....r............................W
    W......r...........r..................rW
    W...........r.......r..................W
    W..r..............r....................W
    W.....................r.........r......W
    W................................r..r..W
    W....r......r.rr..................r....W
    W...........r.rr.........r..r.r.......PW
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "1",
  title: "Intermission",
  author: "Peter Liepa",
  time: 10,
  size: [21, 12],
  diamonds: { needed: 6, worth: 30, extras: 0 },
  map: `
    WWWWWWWWWWWWWWWWWWWWW
    W                   W
    W         r         W
    W  X      .         W
    W                   W
    W                   W
    W                   W
    W                   W
    W                   W
    W                   W
    W         B       P W
    WWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "E",
  title: "Guards",
  hint: "The jewels are there for grabbing, but they are guarded by the deadly fireflies.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 4, worth: 50, extras: 90},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    WX.....................................W
    W......................................W
    W......................................W
    W......................................W
    W......................................W
    W......................................W
    W......................................W
    W.......  q.....  q.....  q.....  q....W
    W.......   .....   .....   .....   ....W
    W....... d ..... d ..... d ..... d ....W
    W......................................W
    W......................................W
    W......................................W
    W.......  q.....  q.....  q.....  q....W
    W.......   .....   .....   .....   ....W
    W....... d ..... d ..... d ..... d ....W
    W......................................W
    W......................................W
    W......................................W
    W......................................W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "F",
  title: "Firefly dens",
  hint: "Each firefly is guarding a jewel.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 4, worth: 50, extras: 90},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    Wwwwwwwwww....r.r..r........r.wwwwwwwwwW
    W         ...........r....r...         W
    W  dq     ..r..........r...r..     qd  W
    Wwwwwwwwww..r........r......r.wwwwwwwwwW
    W         ......r...r.......r.         W
    W  dq     ....r......r.rr.....     qd  W
    Wwwwwwwwww.rr........r.rr.....wwwwwwwwwW
    W         ....r.r....r..r.....         W
    W  dq     ....r.r....r..r..r..     qd  W
    Wwwwwwwwww.rr.r..r....r...r...wwwwwwwwwW
    W         .rr.r..r............         W
    W  dq     ....r..r........r...     qd  W
    Wwwwwwwwww.....r...r....r..r..wwwwwwwwwW
    W....r.r..r........r.....r............rW
    W......r....r....r..r.r...r..r.........W
    W..r....r.....r...r.......r..r.........W
    W..r........r......r.rr.........r......W
    Wr.X...r...........r.rr.........rr..r.PW
    W....r......r.rr......r........r..r....W
    Wrr.........r.rr.........r..r.r.r..r...W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "G",
  title: "Amoeba",
  hint: "Surround the amoeba with boulders, so it can't grow anymore. Pick up jewels that are created when it suffocates.",
  author: "Peter Liepa",
  slowGrowth: 20,
  time: 150,
  size: [40, 22],
  diamonds: {needed: 15, worth: 10, extras: 20},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    W. .. .rr..... ..r. X.... rr r..r. .  .W
    W ..r. .. .  .... .r.r. ...  r..r.d.. .W
    Wr.....  .q.  ... .r.r. ... wwwwwwwwwwwW
    W.r.d... .  ...... ..rr..r.... . ... . W
    Wwwwwwwwwwwww.r. ..   r.. .... ...r....W
    Wr. r...... ..r. ... ..r.  ..r.  q.....W
    Wr. r...... .. r..r.... ...r......r.rr.W
    W... ..r  ... ..r.  ..r.  ... ....r.rr.W
    W... ..r. .r.... ...q......r.r..  r..r.W
    W  .. r.... ..r.r.... .  .......  d.. .W
    W. ... .. .  .. .  .....rr r..r. . r.. W
    W.. d..r.r.... .  ......r  r..r. .  ...W
    W.r.  ..r.  ... .r.r. ...  r.. .... ...W
    W....  .r.  ... .r.r. .r. . r.. r.... .W
    W.  .... ....  .. r r..r.... ...r... .rW
    W..... .  .rr. ...  r.. .r... r..r.r...W
    W r...... ..r. .r.... .  ..r.  r.......W
    W r...... .. r..r.... ...r......r.rr...W
    W. ..r. ... ..r.  .aa.  ... ....r.rr...W
    W. .drq..r.... ...r......r.rq.....dr...W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "H",
  title: "Enchanted wall",
  hint: "Activate the enchanted wall and create as many jewels as you can.",
  author: "Peter Liepa",
  time: 120,
  size: [40, 22],
  diamonds: {needed: 15, worth: 10, extras: 20},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    W . r.. . .. ..r. ..X ..r.  ..r. r... .W
    W.r.rr...... ..r...r.... ...r.....dr.r.W
    W r..r...  ...r..r. ..r.r...wwwwwwwwwwwW
    W...d ..r. q.....r..... ........rr r..rW
    Wwwwwwwwwwwww..r.r.... .  ......r  r..rW
    W.  ... ..r.  ..r.  .... rrr.....  r.. W
    W... r... q.. ..r.  .....r.rr..r. . r..W
    W..r. ..r. r.... ..... ...r r..r.... ..W
    W.....r ...... .  qrr. ...  r.. .r....rW
    Wr.r... . r...... ..r...r....r....dr.  W
    W......r. r......... r..r...wwwwwwwwwwwW
    W.rr...... ..r. ... ..r.  ..r.  ... r..W
    Wwwwwwwwwwwwwr........ ...r......r.rr..W
    W..r...  ...d..r. ..r.rr.........r.rr..W
    W.. ..r. .r...mmmmmmmm.........  r..r..W
    Wr.. r....r..r r...d .. .......  r..r..W
    W ... ..r. ...r.  .....rrrr..r. . r.. rW
    W. r..q.r.... .  ......rr r..r...  ...rW
    Wr.  ..r.  .....r.r. ...  r..r.... ...rW
    W...  .r.r .....r.r.....   .. .r....r..W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "2",
  title: "Intermission",
  author: "Peter Liepa",
  time: 150,
  size: [21, 12],
  diamonds: { needed: 75, worth: 50, extras: 0 },
  map: `
    WWWWWWWWWWWWWWWWWWWWW
    Wrq...............r.W
    WXrq.............rP.W
    Wd.rq...........r.d.W
    Wrd.rq.........r.dr.W
    W.rd.rq.......r.dr..W
    W..rd.rq.....r.dr...W
    W...rd.rq...r.dr....W
    W....rd.rq.r.dr.....W
    W.....rd.rr.dr......W
    W......rd..dr.......W
    WWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "I",
  title: "Greed",
  hint: "You have to get a lot of jewels here, lucky there are so many.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 75, worth: 10, extras: 20},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    Wdddrrddrddr.rrrrdrdd.ddrddrddddrrdrdrrW
    Wdrrdddrrrdrddrrrrrrdrrd.drdrrrrdrddrrdW
    Wddrrrrrrrdrddrr.rrrdrrdddrdr.rrdrrrddrW
    Wrrdrddrrrrrrdrrddd..ddrrdrddrrdrdd.rrdW
    Wrrdrddrrrrrrdrrd.drdrrrrdrdrdrrddrrdrdW
    Wdddrrdrd.ddrrddrrdddrrdrdrrr.drddrrdrdW
    Wrrrrrdrrdddd..rrrdrdd.rdrddr.rrddddddrW
    Wdrddwwwwwww.wwwwwdrrrrdrwwwwww.wwwwwwrW
    Wd.dd             rddrrrd             rW
    Wdrdr  XP         rddrrrd             rW
    Wdrrd             r.rrddr             rW
    Wdrrd             ddddrdr             dW
    Wrddd             drrd.dr             dW
    Wrrrr             drrddrr             rW
    Wdrdd             .rdrrdr             rW
    Wdrdd            wwwwwwwww            rW
    Wrrrd                                 rW
    Wrrrd             dd.rdrd             rW
    Wddrr             rrrdrdd             rW
    Wdd..wwwwwwwwwwwwwdrrrdddwwwwwwwwwwwwwdW
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "J",
  title: "Tracks",
  hint: "Get the jewels, avoid the fireflies.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 75, worth: 25, extras: 60},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    W............X.........................W
    Wwwwwwwwwwwww wwwwwwww.................W
    Ww....d.............dw.................W
    Ww.w w.wwwwww wwwwww.w.................W
    Ww.qqq.wd.........dw.w.................W
    Ww.qqq.w.wwww wwww.w.w.................W
    Ww.qqq.w.wd.....dw.w.w.................W
    Ww.qqq.w.w.ww ww.w.w.w.................W
    Ww.qqq w w w   w w w w.................W
    Ww.qqqqwqwqwqqqwqwqwqw.................W
    Ww.qqq w w w   w w w w.................W
    Ww.qqq.w.w.wwwww.w.w.w.................W
    Ww.qqq.w.wd.....dw.w.w.................W
    Ww.qdq.w.wwwwwwwww.w.w.................W
    Ww.qdq.wd.........dw.w.................W
    Ww.qdq.wwwwwwwwwwwww.w.................W
    Ww.qdqd.............dw.................W
    Wwwwwwwwwwwwwwwwwwwwww.................W
    W......................................W
    W......................................W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "K",
  title: "Crowd",
  hint: "You must move a lot of boulders around in some tight spaces.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 75, worth: 50, extras: 0},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    Wr.rd.rrr.w...drr..rw...d...r.w...dr.r.W
    W... .r.r.w...r r..rwr....r..rwr...r.rrW
    W.... ..rrw.r....r..w..r. rr..w....r.rrW
    Wr.r.. rrrw.r.... ..wr......r.wr......rW
    Wr. ...r..w.  ..r.rrw.......r.wr...... W
    Wrr..r....w...r.....wr.rr.....wr..r r..W
    W..r.rr..rwrr...r...wr.rr.....wr..r. .wW
    W..r...r..w...r.r..rwr..r. .rrw. r..qwrW
    Wr.r.wwwwwwwwwqwwwwwwwwwrwwwwwwwww..w. W
    W.r.  .....rrrr..r.r.rr..rr... r..rwr..W
    Wr.rr......rrrr..r. . r...r..r.rr.wr.rrW
    W. .r.r. w..rrr..r.... ...r.....rw.r.rrW
    W. .r.r. wr.wwwwwwwwwwwwwwwwwrr.w..r...W
    Wr.. rrr.wr....r...r... .rr....w.r.rr.rW
    Wr...rrr.wr.r... r..r.r...r.rrw.....r.PW
    W .r....rw  ..r.rrr.......r.rw...... ..W
    W..r.... w..r......r.rr.....wr..r.r...rW
    Wr.rr..r.wr...r....rXrr......r..rq..r..W
    Wr...r...w..r.rq......r... r.. r..rdr..W
    Wrr.d. ..w..r.rr......r..r. r.q.rr.r...W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "L",
  title: "Walls",
  hint: "You must blast hrough walls to get at some of the jewels. Drop a boulder on a firefly at the right time and place to do this.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 75, worth: 50, extras: 0},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    Wr. ...rr.....r.r..r........r.....r..d.W
    W.....d.r....... ....r....r..r..... ..rW
    W.......rdw.r.w.. w...wr...r..  q . .. W
    Wdwwwwwwwwwww.w...w..rw.....r.    .....W
    Wr........w...w.r.w d.w.....r..........W
    Wrr..r....w...w...w..rwrr......r..d....W
    W..r.....rwrr.w...w..rwrr.........r...rW
    W.wwwwwwwwwww.w.r.w .rw.r....r  q ..d.rW
    Wr.r......w...w.r.w..rw.r..d..    ..r..W
    W.r.......wrr w..dw.. w...r.......d.r..W
    W ........wrr w..rw...w... ..r.....r...W
    W.wwwwwwwwwwwwwwwrw...w...r........r.  W
    W...r.r...w...wr..wr..w.r..r.r  q .....W
    W....r r..w...w...wd..w..r ...    ....dW
    W.... .r..w.d.w..rw.r.w...r. r.........W
    W.wwwwwwwwwww.w...w...w...r. r.........W
    W..r......w.r.w...wr.rw...... ..r......W
    Wr.X...r. w...w...wr.rw.........rd..r..W
    W....r....w.r.wd..w...w.... ...r..d. ..W
    Wrr.......w.r.wd..w...w..r..d.d.r..r...W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "3",
  title: "Intermission",
  author: "Peter Liepa",
  time: 150,
  size: [21, 12],
  diamonds: { needed: 75, worth: 50, extras: 0 },
  map: `
    WWWWWWWWWWWWWWWWWWWWW
    W       X           W
    W                   W
    W                   W
    W                   W
    W                 P W
    W                   W
    W              qqqq W
    W              qqqq W
    W              qqqq W
    Wddddddddddddddqqqq W
    WWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "M",
  title: "Apocalypse",
  hint: "Magically transform the butterflies into jewels, but don't waste any boulders and watch out the fireflies.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: {needed: 75, worth: 50, extras: 0},
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    W..X...................................W
    W......................................W
    W......................................W
    W......................................W
    W.....................q.q.q.q.q.q......W
    W.....................r.r.r.r.r.r......W
    W......................................W
    W......................................W
    W......... B. . . . . .................W
    W.........  . . . . . .................W
    W.........  .B. . . . .................W
    W.........  . . . . . .................W
    W.........  . .B. . . .................W
    W.........  . . . . . .................W
    W.........  . . .B. . .................W
    W.........  . . . . . .................W
    W.........  . . . .B. .................W
    W.........  . . . . . .................W
    W.........  . . . . .B.................W
    W......................................W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
  }, {
  cave: "N",
  title: "Zigzag",
  hint: "Bring the butterflies and amoeba together and watch the jewels fly.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: { needed: 75, worth: 50, extras: 0 },
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    Wr.....rr.P.....r.Xra.......r........r.W
    W.....r.r............r....r..r.r.......W
    W........r..r..............r...........W
    Wr.......r...........r......r..r.......W
    Wr........r.....r...r.......r..r.......W
    W.r..r........r......r.rr.........r....W
    W..r.....r...........r.rr.........r...rW
    W......r......r.r....r..r........r..r..W
    Wr.r..........r.r..........r...........W
    W..........rr.r..r....r...r....r..r.r..W
    W..........r..r..r...........r.....r...W
    W...r.r.......r...........r........r...W
    W...r.r...r....r...r.......r...........W
    W....r.r..r........r.....r............rW
    W......r....r....r..r.r......r.........W
    W..r.wwwwwwwwwwwwwwwwwwwwwwwwwwwwww....W
    W..r.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....W
    Wr...rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr.r..W
    W......................................W
    W.r................................r...W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "O",
  title: "Funnel",
  hint: "There is an enchanted wall at the bottom of the rock tunnel.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: { needed: 75, worth: 50, extras: 0 },
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    Wr.rr..  r..r..r.r..Xr..r.rr..r.rr...r.W
    W.w.rr......r..r...r....w...r......r.r.W
    Wrrw.r... r.. r..r.r..rwr.... .. ..r.rqW
    W...wr..r. q.....r. ..wr.  .....rrrr..rW
    W.rr.wrr... r..r.r...wr. r......rrrr..rW
    W. r..wr..r.r ..r.rrw... rrr. ...rrr..rW
    W...rr.w. q..r..r.rw.....r.rr..r.r.rr..W
    W..r.r..w.rr.... .w...r.. rrr..r....r..W
    W... .rr.w....r. wqrr. ...rrr..r.r... rW
    Wr.r...r.rw.....wr..r. .r....r.  ..r.rrW
    W......r.rrw...w. ..rr..r.... ...r.....W
    W.rr......r....r...r..r.r ..r.rr... r..W
    W.rr......r.mmm..r....r...r......r.rr..W
    W..r... r...r..r.r..r.rr... .....r.rr..W
    W..r..r. .r....r.....r.  ......rrr..r. W
    Wr.. r....r..r.r....r.  .......rrr..r..W
    Wr...r..r.  ..r.  .... rrrr..r.r.rr..rrW
    W. r..q r....r.rr......rrrr..r. .rr.. rW
    Wr.rr..r.rr... .r.r. ...rrr..r.... ...rW
    W...rr.r.rr... .r.r.P...r r..r.r....r..W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "P",
  title: "Enchanted boxes",
  hint: "The top of each square room is an enchanted wall, but you'll have to blast your way inside.",
  author: "Peter Liepa",
  time: 150,
  size: [40, 22],
  diamonds: { needed: 75, worth: 50, extras: 0 },
  map: `
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
    WX..r..........r........r.....r..r.....W
    W.r.rr.........r...r........r......r.r.W
    W.r..r........r..r....r.r..........r.rrW
    W.......r..r.....r..............rr.r..rW
    W..r...r....r..r.r..............r..r..rW
    W.........r.....r........rrr.......r...W
    W....r....r.....r........r.rr..r....r..W
    W..r...mmmmmm..mmmmmm.....r.r..r.......W
    W.....rw....w..w..rrw.......r....r....rW
    Wr.r...w..r.w..w....w...r....r.....r...W
    W......w..r.w..w....wr..r........r.....W
    W.rr...w....wr.w....w.r.....r.......r..W
    W.rr...w....wrrw.r..w.....r......r.rr..W
    W..r...w....w..w....w.rr.........r.rr..W
    W.....rwwwwww..wwwwww............r..r..W
    Wr...r....r..r.r.................r..r..W
    W.............r........r.....r........rW
    W..r..r.  q ....  q ...r  q .r..  q ..rW
    Wr.....r    ....    ....    .r..    ..rW
    W......r.......................r....r..W
    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW`
}, {
  cave: "4",
  title: "Intermission",
  author: "Peter Liepa",
  time: 20,
  size: [21, 12],
  diamonds: { needed: 6, worth: 30, extras: 0 },
  map: `
    WWWWWWWWWWWWWWWWWWWWW
    W..X.......rrr......W
    W..........rrr......W
    W...................W
    W..........mmm......W
    W.......r..   ......W
    W........r.   ......W
    W.........r   ......W
    W........P.mmm......W
    W..........   ......W
    W..........   ......W
    WWWWWWWWWWWWWWWWWWWWW`
}]
