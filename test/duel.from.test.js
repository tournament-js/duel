var $ = require('interlude')
  , Duel = require('../')
  , test = require('bandage');

test('Duel.from', function T(t) {
  var d1 = new Duel(16);
  d1.matches.forEach(function (m) {
    d1.score(m.id, m.p[1] < m.p[0] ? [1,0] : [0,1]); // score inversely to seed
  });
  var top8 = $.pluck('seed', d1.results().slice(0, 8));
  t.deepEqual(top8, [16,15,14,13,9,10,11,12], 'winners are bottom 8 seeds');
  // NB: duel cannot discern the 5th-8th placers so 9-12 are sorted by seed

  var d2 = Duel.from(d1, 8, { short: true });
  t.equal(d2.matches.length, 4+2+1, '7 matches in a pow 3 duel');
  t.deepEqual(d2.players(), [9,10,11,12,13,14,15,16], 'winners in d2');
  // and in fact the seeds map on to who won in d1:
  t.deepEqual(d2.matches[0].p, [16,12], '1 and 8 in m1');
  t.deepEqual(d2.matches[1].p, [9,13], '5 and 4 in m2');
  t.deepEqual(d2.matches[2].p, [14,10], '3 and 6 in m3');
  t.deepEqual(d2.matches[3].p, [11,15], '7 and 2 in m4');

  d2.matches.forEach(function (m) {
    d2.score(m.id, m.p[0] < m.p[1] ? [1,0] : [0,1]); // score by seed this time
  });

  var top4 = $.pluck('seed', d2.results().slice(0, 4));
  t.deepEqual(top4, [9,10,11,12], 'winners top 4 seeds in d2');

  var d3 = Duel.from(d2, 4);
  t.deepEqual(d3.players(), [9,10,11,12], 'top 3 progressed to d3');
});
