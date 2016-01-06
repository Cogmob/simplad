/* imports */
if (true) {
    var s = require('../simplad');
    var writer = s.writer;
    var makeLayer = writer.makeLayer;
    var box = writer.box;
    var write = writer.write;
    var setParamTowriter = writer.setParamTowriter;
    var lift = s.lift('writer');

    var expect = require('chai').expect;

    var ramda = require('ramda');
    var pipe = ramda.pipe;

    function double(i) { return 2*i; }
    function nowriter(i) { return [false,i]; }
    function writewriter(message) {
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

describe('writer', function() {
    it('should write the logs using the box function', function() {
        var res = [];
        var layer = makeLayer();
        layer.registerListener(function(logValue) {
            res.push(logValue);
        });
        pipe(
                echo(3),
                layer.unit,
                layer.bind(echo([0, write('a')])),
                layer.bind(echo([0, write('b')])),
                layer.bind(echo([0, write('c')]))
            )();
        expect(res).to.deep.equal(['a','b','c']);
    });
});
