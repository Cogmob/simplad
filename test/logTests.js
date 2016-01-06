'imports';
if (true) {
    var s = require('../simplad');
    var log = s.log;
    var logLayer = log.makeLayer();
    var hasLog = log.hasLog;
    var noLog = log.noLog;
    var setParamToLog = log.setParamToLog;
    var lift = s.lift;

    var unit = logLayer.unit;
    var bind = logLayer.bind;
    var box = logLayer.box;

    var expect = require('chai').expect;

    var ramda = require('ramda');
    var pipe = ramda.pipe;

    function double(i) { return 2*i; }
    function noLog(i) { return [false,i]; }
    function writeLog(message) {
        return function(i) { return [i,[message]]; };
    }
    function print(i) { console.log(JSON.stringify(i)); return i; }
    function echo(i) {return function() {return i;}}

    function set(obj, param) {
        return function(i) {
            obj[param] = i;
            return i;
        }
    }
}

describe('log', function() {
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

    it('should return three logs', function() {
        var obj = {};
        pipe(
                echo(3),
                unit,
                bind(writeLog(1)),
                bind(writeLog(2)),
                bind(writeLog(3)),
                setParamToLog(obj,'res')
            )();
        expect(obj.res).to.deep.equal([1,2,3]);
    });
});
