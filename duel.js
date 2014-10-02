var Base = require('tournament')
  , $ = require('interlude');

const WB = 1
    , LB = 2
    , WO = -1;

// Id class - so each Id has an automatic string representation
function Id(b, r, m){
  this.s = b;
  this.r = r;
  this.m = m;
}
Id.prototype.toString = function () {
  return (this.s === WB ? "WB" : "LB") + " R" + this.r + " M" + this.m;
};

//------------------------------------------------------------------
// Initialization helpers
//------------------------------------------------------------------

var blank = function () {
  return [Base.NONE, Base.NONE];
};

// mark players that had to be added to fit model as WO's
var woMark = function (ps, size) {
  return ps.map(function (p) {
    return (p > size) ? WO : p;
  });
};

// shortcut to create a match id as duel tourneys are very specific about locations
var gId = function (b, r, m) {
  return new Id(b, r, m);
};

// helpers to initialize duel tournaments
// http://clux.org/entries/view/2407
var evenSeed = function (i, p) {
  var k = Math.floor(Math.log(i) / Math.log(2))
    , r = i - Math.pow(2, k);
  if (r === 0) {
    return Math.pow(2, p - k);
  }
  var nr = (i - 2*r).toString(2).split('').reverse().join('');
  return (parseInt(nr, 2) << p - nr.length) + Math.pow(2, p - k - 1);
};

// get initial players for match i in a power p duel tournament
// NB: match number i is 1-indexed - VERY UNDEFINED for i<=0
var seeds = function (i, p) {
  var even = evenSeed(i, p);
  return [Math.pow(2, p) + 1 - even, even];
};

// make ALL matches for a Duel elimination tournament
var elimination = function (size, p, last, isLong) {
  var matches = [];
  // first WB round to initialize players
  for (var i = 1; i <= Math.pow(2, p - 1); i += 1) {
    matches.push({ id: gId(WB, 1, i), p: woMark(seeds(i, p), size) });
  }

 // blank WB rounds
  var r, g;
  for (r = 2; r <= p; r += 1) {
    for (g = 1; g <= Math.pow(2, p - r); g += 1) {
      matches.push({id: gId(WB, r, g), p: blank() });
    }
  }

  // blank LB rounds
  if (last >= LB) {
    for (r = 1; r <= 2*p - 2; r += 1) {
      // number of matches halves every odd round in losers bracket
      for (g = 1; g <= Math.pow(2, p - 1 - Math.floor((r + 1) / 2)); g += 1) {
        matches.push({ id: gId(LB, r, g), p: blank() });
      }
    }
    matches.push({ id: gId(LB, 2*p - 1, 1), p: blank() }); // grand final match 1
  }
  if (isLong) {
    // bronze final if last === WB, else grand final match 2
    matches.push({ id: gId(LB, last === LB ? 2*p : 1, 1), p: blank() });
  }
  return matches.sort(Base.compareMatches); // sort so they can be scored in order
};

//------------------------------------------------------------------
// progression helpers - assume instance context
//------------------------------------------------------------------

// find the match and position a winner should move "right" to in the current bracket
var right = function (id) {
  var b = id.s
    , r = id.r
    , g = id.m
    , p = this.p;

  // cases where progression stops for winners
  var isFinalSe = (this.last === WB && r === p)
    , isFinalDe = (this.last === LB && b === LB && r === 2*p)
    , isBronze = (this.last === WB && b === LB)
    , isShortLbGf = (b === LB && r === 2*p - 1 && !this.isLong);

  if (isFinalSe || isFinalDe || isBronze || isShortLbGf) {
    return null;
  }

  // special case of WB winner moving to LB GF G1
  if (this.last >= LB && b === WB && r === p) {
    return [gId(LB, 2*p - 1, 1), 0];
  }

  // for LB positioning
  var ghalf = (b === LB && $.odd(r)) ? g : Math.floor((g + 1) / 2);

  var pos;
  if (b === WB) {
    pos = (g + 1) % 2; // normal WB progression
  }
  // LB progression
  else if (r >= 2*p - 2) {
    pos = (r + 1) % 2; // LB final winner -> bottom & GF(1) underdog winner -> top
  }
  else if (r === 1) {
    pos = g % 2; // LBR1 winners move inversely to normal progression
  }
  else {
    // winner from LB always bottom in odd rounds, otherwise normal progression
    pos = $.odd(r) ? 1 : (g + 1) % 2;
  }

  // normal progression
  return [gId(b, r + 1, ghalf), pos];
};

// find the match and position a loser should move "down" to in the current bracket
var down = function (id) {
  var b = id.s
    , r = id.r
    , g = id.m
    , p = this.p;

  // knockouts / special finals
  if (b >= this.last) { // greater than case is for BF in long single elimination
    if (b === WB && this.isLong && r === p - 1) {
      // if bronze final, move loser to "LBR1" at mirror pos of WBGF
      return [gId(LB, 1, 1), (g + 1) % 2];
    }
    if (b === LB && r === 2*p - 1 && this.isLong) {
      // if double final, then loser moves to the bottom
      return [gId(LB, 2 * p, 1), 1];
    }
    // otherwise always KO'd if loosing in >= last bracket
    return null;
  }

  // LB drops: on top for (r>2) and (r<=2 if odd g) to match bracket movement
  var pos = (r > 2 || $.odd(g)) ? 0 : 1;
  // LBR1 only fed by WBR1 (halves normally), else feed -> r=2x later (w/matching g)
  var dId = (r === 1) ? gId(LB, 1, Math.floor((g+1)/2)) : gId(LB, (r-1)*2, g);

  return [dId, pos];
};

// given a direction (one of the above two), move an 'advancer' to that location
var playerInsert = function (progress, adv) {
  if (progress) {
    var id = progress[0]
      , pos = progress[1]
      , insertM = this.findMatch(id);

    if (!insertM) {
      throw new Error("tournament corrupt: " + id + " not found!");
    }

    insertM.p[pos] = adv;
    if (insertM.p[(pos + 1) % 2] === WO) {
      insertM.m = (pos) ? [0, 1] : [1, 0]; // set WO map scores
      return insertM.id; // this id was won by adv on WO, inform
    }
  }
};

// helper to initially score matches with walkovers correctly
var woScore = function (progressFn, m) {
  var idx = m.p.indexOf(WO);
  if (idx >= 0) {
    // set scores manually to avoid the `_verify` walkover scoring restriction
    m.m = (idx === 0) ? [0, 1] : [1, 0];
    progressFn(m);
  }
};

//------------------------------------------------------------------
// statistics helpers
//------------------------------------------------------------------

var lbPos = function (p, maxr) {
  // model position as y = 2^(k+1) + c_k2^k + 1
  // where k(maxr) = floor(roundDiff/2)
  // works upto and including LB final (gf players must be positioned manually)
  var metric = 2*p - maxr;
  var k = Math.floor(metric/2) - 1; // every other doubles
  if (k < 0) {
    throw new Error("lbPos model works for k>=0 only");
  }
  var ck = Math.pow(2, k) * (metric % 2);
  return Math.pow(2, k + 1) + 1 + ck;
};

var wbPos = function (p, maxr) {
  // similar but simpler, double each round, and note that ties are + 1
  // works up to and including semis (WBF + BF must be positioned manually)
  return Math.pow(2, p - maxr) + 1;
};

var placement = function (last, p, maxr) {
  return (last === LB) ? lbPos(p, maxr) : wbPos(p, maxr);
};

//------------------------------------------------------------------
// Interface
//------------------------------------------------------------------

var Duel = Base.sub('Duel', function (opts, initParent) {
  this.isLong = opts.isLong; // isLong for WB => hasBF, isLong for LB => hasGf2
  this.last = opts.last;
  this.limit = opts.limit;
  this.p = Math.ceil(Math.log(this.numPlayers) / Math.log(2));
  initParent(elimination(this.numPlayers, this.p, this.last, this.isLong));

  // manually progress WO markers
  var scorer = woScore.bind(null, this._progress.bind(this));
  this.findMatches({s: WB, r:1}).forEach(scorer);
  if (this.last > WB) {
    this.findMatches({s: LB, r:1}).forEach(scorer);
  }
});

//------------------------------------------------------------------
// Static helpers and constants
//------------------------------------------------------------------

Duel.configure({
  defaults: function (np, opts) {
    var o = {}; // don't modify input
    o.isLong = !opts.short;
    o.last = opts.last || WB;
    o.limit = opts.limit | 0;
    return o;
  },

  invalid: function (np, opts) {
    if (np < 4 || np > 1024) {
      return "numPlayers must be >= 4 and <= 1024";
    }
    if ([WB, LB].indexOf(opts.last) < 0) {
      return "last elimination bracket must be either WB or LB";
    }
    if (opts.limit) {
      return "limits not yet supported";
    }
    return null;
  }
});

var consts = {WB: WB, LB: LB, WO: WO};
Object.keys(consts).forEach(function (key) {
  Object.defineProperty(Duel, key, {
    enumerable: true,
    value: consts[key]
  });
});

Duel.attachNames = function (fn) {
  Duel.prototype.roundName = function (partialId) {
    return fn(consts, this.last, this.p, partialId);
  };
};

//------------------------------------------------------------------
// Expected methods
//------------------------------------------------------------------

Duel.prototype._progress = function (m) {
  // helper to insert player adv into [id, pos] from progression fns
  var inserter = playerInsert.bind(this);

  // 1. calculate winner and loser for progression
  var w = (m.m[0] > m.m[1]) ? m.p[0] : m.p[1]
    , l = (m.m[0] > m.m[1]) ? m.p[1] : m.p[0];
  // in double elimination, the double final should be propagated to with zeroes
  // unless we actually need it (underdog won gfg1 forcing the gfg2 decider)
  var isShortLbGf = (m.id.s === LB && m.id.r === 2*this.p - 1 && this.isLong);
  if (isShortLbGf && w === m.p[0]) {
    w = l = 0;
  }

  // 2. move winner right
  // NB: non-WO match `id` cannot `right` into a WOd match => discard res
  inserter(this.right(m.id), w);

  // 3. move loser down if applicable
  var dres = inserter(this.down(m.id), l);

  // 4. check if loser must be forwarded from existing WO in LBR1/LBR2
  // NB: propagateZeroes is never relevant as LBR2 is always before GF1 when p >= 2
  if (dres) {
    inserter(this.right(dres), l);
  }
};

Duel.prototype._verify = function (m, score) {
  if (m.p[0] === WO || m.p[1] === WO) {
    return "cannot override score in walkover'd match";
  }
  if (score[0] === score[1]) {
    return "cannot draw a duel";
  }
  return null;
};

Duel.prototype._safe = function (m) {
  var rres = this.right(m.id)
    , dres = this.down(m.id)
    , rm = rres && this.findMatch(rres[0])
    , dm = dres && this.findMatch(dres[0]);
  // safe to re-score iff no direct dependents are scored
  return !(rm && rm.m) && !(dm && dm.m);
}

Duel.prototype._early = function () {
  var gf1 = this.matches[this.matches.length - 2];
  return this.isLong && this.last === LB && gf1.m && gf1.m[0] > gf1.m[1];
};

Duel.prototype._stats = function (res, g) {
  var isLong = this.isLong
    , last  = this.last
    , p = this.p
    , isBf = isLong && last === WB && g.id.s === LB
    , isWbGf = last === WB && g.id.s === WB && g.id.r === p
    , isLbGfs = last === LB && g.id.s === LB && g.id.r >= 2*p - 1
    , isLongSemi = isLong && last === WB && g.id.s === WB && g.id.r === p-1
    , canPosition = !isBf && !isWbGf && !isLbGfs && !isLongSemi
    , maxr = (g.id.s < last) ? this.down(g.id, false)[0].r : g.id.r;

  // position players based on reaching the match
  g.p.filter($.gt(0)).forEach(function (s) {
    Base.resultEntry(res, s).pos = canPosition ?
      placement(last, p, maxr): // estimate from minimally achieved last round
      2 + Number(isBf || isLongSemi)*2; // finals are 2 or 4 initially
  });

  // compute stats for played matches - ignore WOs (then p found in next)
  if (g.p.indexOf(WO) < 0 && g.m) {
    // when we have scores, we have a winner and a loser
    var p0 = Base.resultEntry(res, g.p[0])
      , p1 = Base.resultEntry(res, g.p[1])
      , w = (g.m[0] > g.m[1]) ? p0 : p1;

    // inc wins
    w.wins += 1;
    p0.for += g.m[0];
    p1.for += g.m[1];
    p0.against += g.m[1];
    p1.against += g.m[0];

    // bump winners of finals
    var wbWinnerWon = p0.seed === w.seed;
    var isConclusiveLbGf = isLbGfs && (g.id.r === 2*p || !isLong || wbWinnerWon);
    if (isBf || isWbGf || isConclusiveLbGf) {
      w.pos -= 1;
    }
  }
  return res;
};

// exposed helpers - extras
Duel.prototype.down = down;
Duel.prototype.right = right;

module.exports = Duel;
