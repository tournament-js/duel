var Duel = require('../');
var test = require('bandage');

test('Duel.invalid', function T(t) {
  var inv = Duel.invalid;
  t.equal(inv(3), 'numPlayers must be >= 4 and <= 1024', 'lb size limit');
  t.equal(inv(1025), 'numPlayers must be >= 4 and <= 1024', 'ub size limit');
  t.equal(inv(8, { last: 3 }), 'last elimination bracket must be either WB or LB', 'last');
  t.equal(inv(8, { limit: 4}), 'limits not yet supported');
});

test('Duel.attachNames', function T(t) {
  var fn = function (Trn, last, p, id) {
    return id + ' for p=' + p + ' in ' + (last === Trn.LB ? 'DE' : 'SE') + ' mode';
  };
  Duel.attachNames(fn);
  var d = new Duel(8);
  t.equal(d.roundName(d.matches[0].id),
    'WB R1 M1 for p=3 in SE mode',
    'test injected roundName'
  );
});

test('noDraws', function T(t) {
  var d = new Duel(4);
  t.equal(d.unscorable(d.matches[0].id, [1,1]), 'cannot draw a duel', 'cannot draw');
  t.ok(!d.score(d.matches[0].id, [1,1]), 'not allowed');
});

test('safePropagation', function T(t) {
  var d = new Duel(5, { last: 2 });

  // cannot score the WO matches in WBR1
  t.ok(d.unscorable({ s: 1, r: 1, m: 1 }, [1, 0]), 'WBR1 WO matches');
  t.ok(d.unscorable({ s: 1, r: 1, m: 3 }, [1, 0]), 'WBR1 WO matches');
  t.ok(d.unscorable({ s: 1, r: 1, m: 4 }, [1, 0]), 'WBR1 WO matches');
  // but can score the non-WO match
  t.ok(d.score({ s: 1, r: 1, m: 2 }, [0, 1]), 'WBR1 non-wo match');
  // and should be fine to rescore without allowpast
  // despite this match having WO dependant (played) match in LBR1
  t.equal(null, d.unscorable( { s: 1, r: 1, m: 2 }, [1, 0]), 'WBR1 safe');

  // score WBR2
  d.score({s: 1, r: 2, m: 1 }, [1, 0]);
  d.score({s: 1, r: 2, m: 2 }, [1, 0]);
  // so WBR1 is now unsafe
  t.ok(d.unscorable( { s: 1, r: 1, m: 2 }, [1, 0]), 'WBR1 unsafe now');

  // WBR2 also has a match that drops on top of a WO match - check it is safe
  t.equal(null, d.unscorable({ s: 1, r: 2, m: 2 }, [0, 1]), 'WBR2 safe');

  // score LBR2 match so LBR3 is ready (requires relevant WBR2 played)
  d.score({s: 2, r: 2, m: 1}, [1, 0]);

  // score LBR3 match that is ready via WO progressor from WBR2 via LBR2
  d.score({s: 2, r: 3, m: 1}, [1, 0]);

  // at this point - we can see that WBR3 is unplayed, yet it is unsafe
  // to re-score WBR2 because it's loser has fought a match PAST its
  // immediate descendant match (thus _safe checks deeper)
  t.ok(d.unscorable({ s: 1, r: 2, m: 2 }, [0, 1]), 'WBR2 unsafe now');
});
