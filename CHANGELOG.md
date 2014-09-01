1.0.0 / 2014-09-01
==================
  * `Duel::rep` removed (was a bad undocumented feature)
  * `Duel.idString` removed (match ids have .toString())
  * `Duel.defaults` and Duel() no longer modifies options arguments
  * Major bump for satisfaction

0.5.2 / 2014-08-02
==================
  * Documentation and coverage release

0.5.1 / 2014-08-02
==================
  * `roundName` remove and is now a mixin via the `duel-names` module
  * `duel-names` can be mixed in via `Duel.attachNames`

0.5.0 / 2013-12-24
==================
  * Updated `tournament` to 0.21.0 so that `Duel` is an `EventEmitter`

0.4.4 / 2013-11-13
==================
  * Interface with tournament@0.20.2 for default `results[i].against`

0.4.3 / 2013-11-06
==================
  * Interface with tournament@0.20.0 for cleaner results implementation

0.4.1 / 2013-11-02
==================
  * Interface with tournament@0.19.0 for multi stage support

0.4.0 / 2013-10-31
==================
  * `last` now passed in as an optional argument (single elimination default)
  * Use tournament@0.18.0 interface

0.3.0 / 2013-10-25
==================
  * Use tournament@0.17.0 interface
  * Rename `maps` to `for` and add `against` as well to count both map wins and map losses
  * Huge code readability improvements

0.2.0 / 2013-10-22
==================
  * Use tournament@0.16.0 interface

0.1.1 / 2013-10-16
==================
  * refactor `score` to use Base implementation

0.1.0 / 2013-10-15
==================
  * first release - factored out of tournament 0.14.0
