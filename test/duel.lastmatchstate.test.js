var Duel = require('../');

exports.lbgfg1rescoring = function (t) {
  var d = new Duel(4, { last: Duel.LB });
  var ms = d.matches;

  t.equal(ms.length, 7, "3 lb + 2 lb + 2 lb gfs");

  // score s.t. [1,2] are left in GF G1
  d.matches.slice(0, -2).forEach(function (m) {
    d.score(m.id, m.p[0] < m.p[1] ? [1,0] : [0, 1]);
  });

  var gfg1 = d.matches[d.matches.length-2];
  var gfg2 = d.matches[d.matches.length-1];
  t.deepEqual(gfg1.p, [1,2], "1 and 2 in gfg1");
  t.deepEqual(gfg2.p, [0,0], "gfg2 unfilled");

  // upcoming for those players is gfg1 only
  t.deepEqual(d.upcoming(1), [gfg1], "p1 is in upcoming gfg1 only");
  t.deepEqual(d.upcoming(2), [gfg1], "p2 is in upcoming gfg1 only");

  // score s.t. it finished early
  t.ok(d.score(gfg1.id, [1,0]), 'gfg1 early exit');
  t.deepEqual(gfg2.p, [0,0], "gfg2 unfilled");
  t.ok(d.isDone(), 'duel technically done, but can yet rescore');
  t.deepEqual(d.upcoming(1), [], "p1 is not in gfg2 as gfg1 finished early");
  t.deepEqual(d.upcoming(2), [], "p2 is not in gfg2 as gfg1 finished early");

  // recore s.t. gfg2 necessary
  t.ok(d.score(gfg1.id, [0,1]), 'gfg1 rescored');
  t.deepEqual(gfg2.p, [2,1], "gfg2 filled");
  t.ok(!d.isDone(), 'duel no longer done gfg2 must be played');
  t.deepEqual(d.upcoming(1), [gfg2], "p1 is in gfg2 now");
  t.deepEqual(d.upcoming(2), [gfg2], "p2 is in gfg2 now");

  // rescore s.t. gfg2 is no longer necessary (fine since gfg2 is unplayed)
  t.ok(d.score(gfg1.id, [1,0]), 'gfg1 early exit again');
  t.ok(d.isDone(), 'duel technically done again');
  t.deepEqual(gfg2.p, [0,0], "gfg2 unfilled again");
  t.deepEqual(d.upcoming(1), [], "p1 is not in gfg2 as gfg1 finished early again");
  t.deepEqual(d.upcoming(2), [], "p2 is not in gfg2 as gfg1 finished early again");

  // rescore s.t. gfg2 and gfg2 is odne
  t.ok(d.score(gfg1.id, [0, 1]), 'back to gfg2');
  t.ok(d.score(gfg2.id, [1, 0]), 'score gfg2');
  t.equal(d.unscorable(gfg1.id, [1, 0]), "LB R3 M1 cannot be re-scored", '!gfg1');

  // but verify that it would have worked if it was in short mode!
  d.isLong = false; // bad user behaviour!
  t.equal(d.unscorable(gfg1.id, [1, 0]), null, 'gfg1 re-score would have worked');

  t.done();
};
