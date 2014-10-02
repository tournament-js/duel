var Duel = require(process.env.DUEL_COV ? '../duel-cov.js' : '../');

exports.invalid = function (t) {
  var inv = Duel.invalid;
  t.equal(inv(3), "numPlayers must be >= 4 and <= 1024", "lb size limit");
  t.equal(inv(1025), "numPlayers must be >= 4 and <= 1024", "ub size limit");
  t.equal(inv(8, { last: 3 }), "last elimination bracket must be either WB or LB", "last");
  t.equal(inv(8, { limit: 4}), "limits not yet supported");

  t.done();
};


exports.roundNames = function (t) {
  var fn = function (T, last, p, id) {
    return id + ' for p=' + p + ' in ' + (last === T.LB ? 'DE' : 'SE') + ' mode';
  };
  Duel.attachNames(fn);

  var d = new Duel(8);
  t.equal(d.roundName(d.matches[0].id),
    "WB R1 M1 for p=3 in SE mode",
    "test injected roundName"
  );

  t.done();
};
