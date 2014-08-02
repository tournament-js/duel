/**
 * roundNames UI helper function for Duel tournaments - localized to English
 *
 * Full localization, require more work than simply swapping strings:
 * In particular, rounds like 'Round of 8/16' is called '8ths/16ths Finals' in other
 * countries, whereas we just hard coded them as string + Math.pow(2, x).
 *
 * Fork this module and attach it to `Duel`.
 */

var appendRoundNum = function (str) {
  return function (num) {
    return str + " of " + num;
  };
};
var constant = function (str) {
  return function () {
    return str;
  };
};

var seNames = [
  // bronze final is a special case and must be the first entry
  constant("Bronze final"), // bronze final match may be part of the 'finals' round
  // remaining entries are rounds in descending order of importance
  constant("Grand final"),  // often called just the 'Final'
  constant("Semi-finals"),
  constant("Quarter-finals"),
  appendRoundNum("Round")
];

// when in double elimination we use these 2
var wbNames = [
  constant("WB Final"),
  constant("WB Semi-finals"),
  constant("WB Quarter-finals"),
  appendRoundNum("WB Round")
];
var lbNames = [
  constant("Grand final"),          // Strong grand final (no prefix lest we spoil)
  constant("Grand final"),          // Potentially last game
  constant("LB Strong final"),      // 3rd place decider
  constant("LB Final"),             // 4th place decider
  appendRoundNum("LB Round"),       // first time there's X in LB
  appendRoundNum("LB Strong Round") // last time there's X in LB
];


var roundNameSingle = function (T, last, p, br, r) {
  if (br === T.LB) {
    return seNames[0]();
  }
  return ((r > p - 3) ? seNames[p - r + 1] : seNames[4])(Math.pow(2, p - r + 1));
};

var roundNameDouble = function (T, last, p, br, r) {
  if (br === T.WB) {
    return ((r > p - 3) ? wbNames[p - r] : wbNames[3])(Math.pow(2, p - r + 1));
  }
  // else T.LB
  if (r >= 2*p - 3) {
    return lbNames[2*p - r](); // grand final rounds or LB final
  }

  // Round of %d - where %d is num players left in LB
  if (r % 2 === 1) {
    return lbNames[4](Math.pow(2, p-(r+1)/2));
  }
  // Mixed round of %d (always the same as the round before because of feeding)
  return lbNames[5](Math.pow(2, p - r/2));
};


// can take a partial id where everything but the match number is left out
// T is a constants object injected by Duel along with last bracket and Duel power.
module.exports = function (T, last, p, partialId) {
  var br = partialId.s
    , r = partialId.r;

  // sanity
  if (!Number.isFinite(r) || r < 1 || [T.WB, T.LB].indexOf(br) < 0) {
    throw new Error("invalid partial id for roundName: " + partialId);
  }
  var invWB = (br === T.WB && r > p)
    , invSeLB = (last === T.WB && br >= T.LB && r !== 1)
    , invDeLB = (last === T.LB && r > 2*p);

  if (invWB || invSeLB || invDeLB) {
    var str = "br=" + br + ", last=" + last;
    throw new Error("invalid round number " + r + " given for elimination: " + str);
  }

  var fn = (last === T.WB) ? roundNameSingle : roundNameDouble;
  return fn(T, last, p, br, r);
};
