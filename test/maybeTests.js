if (true) {
    var maybe = require('../simplad').maybe;
    var unit = maybe.unit;
    var bind = maybe.bind;
    var box = maybe.box;
    var lift = maybe.lift;
    var isFalse = maybe.lift;

    var expect = require('chai').expect;

    var ramda = require('ramda');
    var pipe = ramda.pipe;

    function double(i) { return 2*i; }
    function noValue(i) { return [false,i]; }
    function print(i) { console.log(JSON.stringify(i)); return i; }
    function echo(i) {return function() {return i;}}

    function set(obj, param) {
        return function(i) {
            obj[param] = i;
            return i;
        }
    }
}

describe('unit', function() {
    it('should bind a single function', function() {
        var obj = {};
        pipe(
                echo(3),
                unit,
                bind(lift(double)),
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

    it('should correctly box with a default value', function() {
        var boxed = box([true], 'value');
        expect(boxed).to.deep.equal([true,'value']);
    });

    it('should correctly box when there is no value', function() {
        var boxed = box(maybe.noValue, 'value');
        expect(boxed).to.deep.equal([false, 'value']);
    });
});
