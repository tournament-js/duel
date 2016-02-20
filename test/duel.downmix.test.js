var $ = require('interlude')
  , Duel = require('../')
  , Id = Duel.Id
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
test('downMixComparison', function *T(t) {
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
test('downMixCompletion', function *T(t) {
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

test('downMixPow6', function *T(t) {
  var d = new Duel(Math.pow(2, 6), { last: LB, downMix: true });

  // Verify WBR2 -> LBR2 reverser order completely
  for (var i = 1; i <= 16; i += 1) {
    var dn = d.down({s: WB, r: 2, m: i});
    t.equal(dn[1], 0, 'always drop on top when downmixing');
    t.deepEqual(dn[0], Id(LB, 2, 16-i+1), 'always drop on top when downmixing');
  }

  // Verify WBR3 -> LBR4 reverses in chunks of two, but same style of split as in LBR2
  var verifyMap3 = function (wbm, lbm) {
    var dn = d.down({s: WB, r: 3, m: wbm})[0];
    t.deepEqual(dn, Id(LB, 4, lbm), 'match map for WBR3');
  };
  verifyMap3(1, 4);
  verifyMap3(2, 3);
  verifyMap3(3, 2);
  verifyMap3(4, 1);
  verifyMap3(5, 8);
  verifyMap3(6, 7);
  verifyMap3(7, 6);
  verifyMap3(8, 5);

  // Verify WBR4 -> LBR6 - reversing in chunks of two
  var verifyMap4 = function (wbm, lbm) {
    var dn = d.down({s: WB, r: 4, m: wbm})[0]
    t.deepEqual(dn, Id(LB, 6, lbm), 'match map for WBR4');
  };
  verifyMap4(1, 3);
  verifyMap4(2, 4);
  verifyMap4(3, 1);
  verifyMap4(4, 2);
});

test('downMixPow8', function *T(t) {
  var d = new Duel(Math.pow(2, 8), { last: LB, downMix: true });

  // Verify WBR2 -> LBR2 reverser order completely
  for (var i = 1; i <= 64; i += 1) {
    var dn = d.down({s: WB, r: 2, m: i});
    t.equal(dn[1], 0, 'always drop on top when downmixing');
    t.deepEqual(dn[0], Id(LB, 2, 64-i+1), 'always drop on top when downmixing');
  }

  // Verify WBR3 -> LBR4 reverses in chunks of two, but same style of split as in LBR2
  var verifyMap3 = function (wbm, lbm) {
    var dn = d.down({s: WB, r: 3, m: wbm})[0]
    t.deepEqual(dn, Id(LB, 4, lbm), 'match map for WBR3');
  };
  verifyMap3(1, 16);
  verifyMap3(2, 15);
  verifyMap3(15, 2);
  verifyMap3(16, 1);
  verifyMap3(17, 32);
  verifyMap3(18, 31);
  verifyMap3(31, 18);
  verifyMap3(32, 17);

  // Verify WBR4 -> LBR6 - reversing in chunks of two
  var verifyMap4 = function (wbm, lbm) {
    var dn = d.down({s: WB, r: 4, m: wbm})[0]
    t.deepEqual(dn, Id(LB, 6, lbm), 'match map for WBR4');
  };
  verifyMap4(1, 9);
  verifyMap4(2, 10);
  verifyMap4(7, 15);
  verifyMap4(8, 16);
  verifyMap4(9, 1);
  verifyMap4(10, 2);
  verifyMap4(15, 7);
  verifyMap4(16, 8);

  // Verify WBR5 -> LBR8 - is identity
  var verifyMap5 = function (wbm, lbm) {
    var dn = d.down({s: WB, r: 5, m: wbm})[0]
    t.deepEqual(dn, Id(LB, 8, lbm), 'match map for WBR5');
  };
  verifyMap5(1, 1);
  verifyMap5(2, 2);
  verifyMap5(3, 3);
  verifyMap5(4, 4);
  verifyMap5(5, 5);
  verifyMap5(6, 6);
  verifyMap5(7, 7);
  verifyMap5(8, 8);

  // Verify WBR6 -> LBR10 reverses plainly
  var verifyMap6 = function (wbm, lbm) {
    var dn = d.down({s: WB, r: 6, m: wbm})[0]
    t.deepEqual(dn, Id(LB, 10, lbm), 'match map for WBR5');
  };
  verifyMap6(1, 4);
  verifyMap6(2, 3);
  verifyMap6(3, 2);
  verifyMap6(4, 1);


  // Verify WBR7 -> LBR12
  var verifyMap7 = function (wbm, lbm) {
    var dn = d.down({s: WB, r: 7, m: wbm})[0]
    t.deepEqual(dn, Id(LB, 12, lbm), 'match map for WBR5');
  };
  verifyMap7(1, 1);
  verifyMap7(2, 2);
});
