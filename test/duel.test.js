var $ = require('interlude')
  , Duel = require(process.env.DUEL_COV ? '../duel-cov.js' : '../');

const WB = Duel.WB;
const LB = Duel.LB;
const WO = Duel.WO;

exports.losersUnderdog = function (t) {
  // long LB underdog lost
  var duel = new Duel(16, { last: LB, short: false });
  duel.matches.slice(0, -2).map(function (m, i) {
    t.equal(duel.unscorable(m.id, [1,0]), null, "can score long m" + i);
    t.ok(duel.score(m.id, m.p[0] < m.p[1] ? [2,1] : [1,2]), "can score long m" + i);
  });
  t.ok(duel.score(duel.matches[duel.matches.length-2].id, [1,0]), "could score gf1");
  t.deepEqual($.last(duel.matches).p, [0, 0], "no players in gf2 when quick gf");
  t.ok(duel.isDone(), "duel tournament should be done now");
  t.ok(duel.unscorable($.last(duel.matches).id, [1,0], true), "cannot score GF2");
  t.ok(!duel.score($.last(duel.matches).id, [2, 1]), "could NOT score GF2");

  // long LB underdog won
  duel = new Duel(16, { last: LB, short: false });
  duel.matches.slice(0, -2).map(function (m, i) {
    t.equal(duel.unscorable(m.id, [1,0]), null, "can score long m" + i);
    t.ok(duel.score(m.id, m.p[0] < m.p[1] ? [2,1] : [1,2]), "can score long m" + i);
  });
  t.ok(duel.score(duel.matches[duel.matches.length-2].id, [0,1]), "could score GF1");
  t.deepEqual($.last(duel.matches).p, [2, 1], "underdog win => forwarding");
  t.ok(!duel.isDone(), "there should be one more match to play");
  t.equal(duel.unscorable($.last(duel.matches).id, [1,0]), null, "can score GF2");
  t.ok(duel.score($.last(duel.matches).id, [2, 1]), "could score GF2");
  t.ok(duel.isDone(), "long GF2 played so we are done");

  // short LB underdog lost
  duel = new Duel(16, { last: LB, short: true });
  duel.matches.map(function (m, i) {
    t.equal(duel.unscorable(m.id, [1,0]), null, "can score short m" + i);
    t.ok(duel.score(m.id, [1,2]), "can score short m" + i);
  });
  t.ok(duel.isDone(), "duel tournament should be done now");

  // short LB underdog won
  duel = new Duel(16, { last: LB, short: true });
  duel.matches.map(function (m, i) {
    t.equal(duel.unscorable(m.id, [1,0]), null, "can score short m" + i);
    t.ok(duel.score(m.id, [2,1]), "can score short m" + i);
  });
  t.ok(duel.isDone(), "duel tournament should be done now");

  t.done();
};

exports.singleGeneral = function (t) {
  var duel = new Duel(32)
    , gs = duel.matches
    , p = duel.p;

  t.equal(gs.length, Math.pow(2, p), "size of big t"); // incl bronzefinal

  var lastM = gs[gs.length-1];
  t.ok(!lastM.m, "no map scores recorded for last match yet");

  gs.forEach(function (g) {
    // will produce some warnings when there are WO markers present
    duel.score(g.id, [0, 2]);
  });

  t.ok(lastM.m, "map scores recorded for last match");
  var lastPls = lastM.p.filter(function (n) {
    return (n !== 0 && n !== WO);
  });
  // note this only true because this case gets a double final
  t.equal(lastPls.length, 2, "got two players at the end when scoring everything");

  var res = duel.results();
  t.ok(res, "results produced");
  t.equal(res.length, 32, "all players included in results");

  t.done();
};

exports.doubleGeneral = function (t) {
  var duel = new Duel(32, { last: LB })
    , gs = duel.matches
    , p = duel.p;

  // size == sizeof wb (powers of two consecutively)
  // += size of lb == 2x size of smaller WB (gfs cancels out 2x -1s)
  t.equal(gs.length, Math.pow(2, p) - 1 + 2*Math.pow(2, p - 1), "size of big t");

  var lastM = gs[gs.length-1];
  t.ok(!lastM.m, "no map scores recorded for last match yet");

  gs.forEach(function (g) {
    // will produce some warnings when there are WO markers present
    duel.score(g.id, [0, 2]);
  });

  t.ok(lastM.m, "map scores recorded for last match");
  var lastPls = lastM.p.filter(function (n) {
    return (n !== 0 && n !== WO);
  });
  // note this only true because this case gets a double final
  t.equal(lastPls.length, 2, "got two players at the end when scoring everything");

  var res = duel.results();
  t.ok(res, "results produced");
  t.equal(res.length, 32, "all players included in results");

  t.done();
};

exports.simgleSingleRes = function (t) {
  // try scoring everything in order
  var duel = new Duel(5)
    , gs = duel.matches;

  var lastM = gs[gs.length-1];
  t.ok(!lastM.m, "no map scores recorded for last match yet");

  gs.forEach(function (g) {
    // will produce some warnings when there are WO markers present
    duel.score(g.id, (g.p[0] < g.p[1]) ? [2, 0] : [0, 2]); // score highest winner
  });

  t.ok(lastM.m, "map scores recorded for last match");
  var lastPls = lastM.p.filter(function (n) {
    return (n !== 0 && n !== WO);
  });
  // note this only true because this case gets a double final
  t.equal(lastPls.length, 2, "got two players at the end when scoring everything");

  var res = duel.results();
  t.ok(res, "results produced");

  res.forEach(function (p) {
    if (p.seed === 1) {
      t.equal(p.pos, 1, "player 1 gets 1st");
      t.equal(p.wins, 2, "player 1 win count"); // got 1 wo free
      t.equal(p.for, 2*2, "player 1 map count");
    }
    else if (p.seed === 2) {
      t.equal(p.pos, 2, "player 2 gets 2nd");
      t.equal(p.wins, 1, "player 2 win count"); // 1 (+wo)
      t.equal(p.for, 1*2, "player 2 map count");
    }
    else if (p.seed === 3) {
      t.equal(p.pos, 3, "player 3 gets 3rd");
      t.equal(p.wins, 1, "player 3 win count"); // 1 + bf (+wo)
      t.equal(p.for, 1*2, "player 3 map count");
    }
    else if (p.seed === 4) {
      t.equal(p.pos, 4, "player 4 gets 4th");
      t.equal(p.wins, 1, "player 4 win count"); // 1
      t.equal(p.for, 1*2, "player 4 map count");
    }
    else if (p.seed === 5) {
      t.equal(p.pos, 5, "player 5 gets 5");
      t.equal(p.wins, 0, "player 5 win count");
      t.equal(p.for, 0*2, "player 5 map count");
    }
    else {
      t.ok(false, "should not be any other players in results");
    }
  });

  var sorted = $.pluck('seed', res);
  t.deepEqual(sorted, $.range(5), "results sorted after position");

  t.done();
};

exports.bigDouble = function (t) {
  // try scoring everything in order
  var duel = new Duel(128, { last: LB })
    , gs = duel.matches
    , p = duel.p;

  t.equal(gs.length, Math.pow(2, p) - 1 + 2*Math.pow(2, p - 1), "size of big t");

  var lastM = gs[gs.length-2]; // wont be a double final
  t.ok(!lastM.m, "no map scores recorded for last match yet");

  gs.forEach(function (g) {
    // will produce some warnings when there are WO markers present
    duel.score(g.id, (g.p[0] < g.p[1]) ? [2, 0] : [0, 2]); // score highest winner
  });

  t.ok(lastM.m, "map scores recorded for last match");
  var lastPls = lastM.p.filter(function (n) {
    return (n !== 0 && n !== WO);
  });
  // note this only true because this case gets a double final
  t.equal(lastPls.length, 2, "got two players at the end when scoring everything");

  var res = duel.results();
  t.ok(res, "results produced");

  var sorted = $.pluck('seed', res.slice(0, 4));
  t.deepEqual(sorted, $.range(4), "results sorted after position");

  t.done();
};



exports.detailedDouble = function (t) {
  // try scoring everything in order
  var duel = new Duel(5, { last: LB })
    , gs = duel.matches;

  var lastM = gs[gs.length-1];
  t.ok(!lastM.m, "no map scores recorded for last match yet");

  gs.forEach(function (g) {
    // will produce some warnings when there are WO markers present
    duel.score(g.id, [0, 2]);
  });

  t.ok(lastM.m, "map scores recorded for last match");
  var lastPls = lastM.p.filter(function (n) {
    return (n !== 0 && n !== WO);
  });
  // note this only true because this case gets a double final
  t.equal(lastPls.length, 2, "got two players at the end when scoring everything");

  var res = duel.results();
  t.ok(res, "results produced");

  res.forEach(function (p) {
    if (p.seed === 2) {
      t.equal(p.pos, 1, "player 2 gets 1st");
      t.equal(p.wins, 3, "player 2 win count");
      t.equal(p.for, 3*2, "player 2 map count");
    }
    else if (p.seed === 3) {
      t.equal(p.pos, 2, "player 3 gets 2nd");
      t.equal(p.wins, 3, "player 3 win count");
      t.equal(p.for, 3*2, "player 3 map count");
    }
    else if (p.seed === 4) {
      t.equal(p.pos, 3, "player 4 gets 3rd");
      t.equal(p.wins, 2, "player 4 win count");
      t.equal(p.for, 2*2, "player 4 map count");
    }
    else if (p.seed === 5) {
      t.equal(p.pos, 4, "player 5 gets 4th");
      t.equal(p.wins, 1, "player 5 win count");
      t.equal(p.for, 1*2, "player 5 map count");
    }
    else if (p.seed === 1) {
      t.equal(p.pos, 5, "player 1 gets 5-6th");
      t.equal(p.wins, 0, "player 1 win count");
      t.equal(p.for, 0*2, "player 1 map count");
    }
    else {
      t.ok(false, "should not be any other players in results");
    }
  });

  var sorted = $.pluck('seed', res);
  t.deepEqual(sorted, [2, 3, 4, 5, 1], "results sorted after position");

  t.done();
};


exports.doubleHelpers = function (t) {
  var d = new Duel(8, { last: LB }) // NO WO markers in this (easy case)
    , ms = d.matches;

  // WB check
  $.range(3).forEach(function (r) {

    // upcoming
    $.range(Math.pow(2, 3-r)).forEach(function (n) {
      var up = d.upcoming(n);
      t.ok(up.length, "upcoming match exists for round " + r + " advancer");
      t.equal(up[0].id.r, r, "upcoming match for this round is in round " + r);
      t.equal(up[0].id.s, WB, "upcoming match for round " + r + " is in WB");
    });

    // score
    d.findMatches({s:WB, r:r}).forEach(function (g) {
      t.equal(d.unscorable(g.id, [1,0]), null, "WB R" + r + " are scorable");
      t.ok(d.score(g.id, (g.p[0] > g.p[1]) ? [1, 2] : [2, 1]), "scored m in R" + r);
    });

    if (r === 3) {
      var up = d.upcoming(1);
      t.equal(up[0].id.s, LB, "upcoming match for WB final winner is in LB");
    }
  });

  // LB check
  var maxr = $.maximum($.pluck('r', $.pluck('id', ms)));
  $.range(maxr - 1).forEach(function (r) { // all rounds but gf2 round

    // upcoming
    d.players({s: LB, r:r}).forEach(function (n) {
      t.ok(n > WO, "player found was filled in and not a WO marker");
      var up = d.upcoming(n);
      t.ok(up.length, "upcoming match exists for round " + r + " advancer");
      t.equal(up[0].id.r, r, "upcoming match for this round is in round " + r);
      t.equal(up[0].id.s, LB, "upcoming match for round " + r + " is in LB");
    });

    // check all matches in this round
    d.findMatches({s:LB, r:r}).forEach(function (g) {
      t.equal(d.unscorable(g.id, [1,0]), null, "LB R" + r + " is scorable");
      t.ok(d.score(g.id, (g.p[0] > g.p[1]) ? [1, 2] : [2, 1]), "scored m in R" + r);
    });

    if (r === 2*d.p - 1) {
      var up = d.upcoming(1);
      t.ok(!up.length, "no double final, favourite won");
    }
  });

  t.done();
};
