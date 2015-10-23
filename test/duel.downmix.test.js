var $ = require('interlude')
  , Duel = require('../')
  , test = require('bandage');

const WB = Duel.WB;
const LB = Duel.LB;
const WO = Duel.WO;

/**
 * General downMix test that verifies that LB matches are dropped differently
 * but that matches still complete.
 *
 * Note that while we check that LBR2,3,4 differ on a match by match basis
 * This is not true in round 5 if we increase to 32 players, as the mixups just happen
 * to get back to the original match setup there (despite there being two matches).
 * The matches are however, mirrored, but it's not really the behaviour
 * we would like to enforce or test. Just a coincidence.
 *
 * Since the mixups are deterministic this MUST still never break.
 */
test('downMixComparison', function T(t) {
  // two duels that should behave identicaly except progression
  var dm = new Duel(16, { last: LB, short: true, downMix: true });
  var d = new Duel(16, { last: LB, short: true });

  d.matches.forEach(function (g) {
    d.score(g.id, g.p[0] < g.p[1] ? [2,0] : [0, 2]);
  });

  dm.matches.forEach(function (g) {
    dm.score(g.id, g.p[0] < g.p[1] ? [2,0] : [0, 2]);
  });

  t.ok(dm.isDone(), 'dm is done');
  t.ok(d.isDone(), 'd is done');

  t.deepEqual(dm.findMatches({s: 1}), d.findMatches({s: 1}), 'wb identical');
  t.deepEqual(dm.findMatches({s: 2, r: 1}), d.findMatches({s: 2, r: 1}), 'lbr1 identical');
  [2,3,4].forEach(function (r) {
    var partial = {s: 2, r: r};
    var len = dm.findMatches(partial).length;
    t.equal(len, d.findMatches(partial).length, 'same number of matches in LBR' + r);
    t.deepEqual(dm.players(partial), d.players(partial), 'same player set in LBR' + r);
    for (var i = 0; i < len; i += 1) {
      var id = Object.assign(partial, {m: i + 1});
      var mm = dm.findMatch(id);
      var m = d.findMatch(id);
      t.ok($.difference(mm.p, m.p).length >= 1, 'mixed up ' + mm.id);
    }
  });
});

/**
 * General check that finals are handled correctly when using downMix
 *
 * Will verify the number of finals, and that all variations are sensible.
 * Will verify pretty much all sensible tournament numbers at perfect powers,
 * including +-1 to get the extreme edge cases right.
 * This ensures downMix doubles are always completable.
 */
test('downMixCompletion', function T(t) {
  [4,5,7,8,9,15,16,17,31,32,33,63,64,65,127,128,200,255,256].forEach(function (numPlayers) {
    [false, true].forEach(function (underDogWins) {
      [false, true].forEach(function (short) {
        var duel = new Duel(numPlayers, { last: LB, downMix: true, short: short });
        duel.matches.forEach(function (g) {
          if (!duel.unscorable(g.id, [1,0])) { // avoid log when !short, !underDogWins in gf2
            duel.score(g.id, underDogWins ? [0,2] : [2,0]);
          }
        });
        var lastR = 2*duel.p - 1;
        var finals = duel.findMatchesRanged({s: 2, r: lastR});
        t.equal(finals.length, 1 + Number(!short), 'number of finals when short is ' + short);
        if (!short) {
          var gf2 = finals[1];
          t.equal(duel.isPlayable(gf2), underDogWins, 'gf2 only playable if underDogWins gf1');
        }
        t.ok(duel.isDone(), 'completed ' + numPlayers + 'p ' + (short ? 'short' : 'long') + ' duel');
      });
    });
  });
});
