if (true) {
    var s = require('../simplad');
    var maybe = s.maybe;
    var maybeLayer = maybe.makeLayer();
    var unit = maybeLayer.unit;
    var bind = maybeLayer.bind;

    var isFalse = maybe.isFalse;

    var expect = require('chai').expect;

    var ramda = require('ramda');
    var pipe = ramda.pipe;

    function double(i) { return 2*i; }
    function noValue(i) { return [false]; }
    function print(i) { console.log(JSON.stringify(i)); return i; }
    function echo(i) {return function() {return i;}}

    function set(obj, param) {
        return function(i) {
            obj[param] = i;
            return i;
        }
    }
}

describe('maybe', function() {
    it.only('should bind a single function', function() {
        var obj = {};
        pipe(
                echo(3),
                unit,
                bind(function(i) {
                    return [double, [true], {}];
                }),
                print,
                bind(lift(set(obj, 'res')))
            )();
        expect(obj.res).to.equal(6);
    });

    it('should bind two functions', function() {
        var obj = {};
        pipe(
                echo(3),
                unit,
                bind(lift(double)),
                bind(lift(double)),
                bind(lift(set(obj, 'res')))
            )();
        expect(obj.res).to.equal(12);
    });

    it('should not run functions after maybe has no value', function() {
        var obj = {};
        pipe(
                echo(3),
                unit,
                bind(lift(double)),
                bind(lift(set(obj, 'res'))),
                noValue,
                bind(lift(double)),
                bind(lift(double)),
                bind(lift(set(obj, 'res')))
            )();
        expect(obj.res).to.equal(6);
    });
});
