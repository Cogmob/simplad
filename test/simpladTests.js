if (true) {
    var s = require('../simplad');
    var maybe = s.maybe;
    var makeLayer = s.simplad.makeLayer;
    var log = s.log;
    var lift = s.lift;
    var writer = s.writer;
    var write = s.writer.write;

    var expect = require('chai').expect;

    var testMonad = require('./js/testMonad.js').monad();

    var ramda = require('ramda');
    var pipe = ramda.pipe;

    function double(i) { return 2*i; }
    function print(i) { console.log(JSON.stringify(i,null,2)); return i; }
    function echo(i) {return function() {return i;}}
    function set(obj, param) {
        return function(i) {
            obj[param] = i;
            return i;
        }
    }
}

describe('test monad', function() {
    it('should create the correct unit', function() {
        var monad = testMonad.makeLayer('test id');
        expect(monad.unit(1)).to.deep.equal({
            'createdFrom': 'unit',
            'deltas': [],
            'monadId': 'test id',
            'value': 1
        });
    });

    it('should nest one inside the other', function() {
        var monad1 = testMonad.makeLayer('layer 1');
        var monad2 = testMonad.makeLayer('layer 2');

        expect(monad2.unit(monad1.unit(1))).to.deep.equal({
            createdFrom: 'unit',
            deltas: [],
            monadId: 'layer 2',
            value: {
                createdFrom: 'unit',
                deltas: [],
                monadId: 'layer 1',
                value: 1
            }
        });
    });

    it('should bind the function successfully', function() {
        var monad1 = testMonad.makeLayer('layer 1');
        var monad2 = testMonad.makeLayer('layer 2');

        var bound = monad1.unit(1);
        var func = function(i) {return [2*i, [false, 'inner delta']];};
        var newFunc = monad1.bind(func);
        var res = newFunc(bound);

        expect(res).to.deep.equal({
            createdFrom: 'bind',
            deltas: [
                'inner delta'
            ],
            monadId: 'layer 1',
            value: 2
        });
    });

    it('should bind the function successfully twice', function() {
        var monad1 = testMonad.makeLayer('layer 1');
        var monad2 = testMonad.makeLayer('layer 2');

        var bound = monad1.unit(1);
        var func = function(i) {return [2*i, [false, 'inner delta']];};
        var newFunc = monad1.bind(func);
        var res = newFunc(newFunc(bound));

        expect(res).to.deep.equal({
            createdFrom: 'bind',
            deltas: [
                'inner delta',
                'inner delta'
            ],
            monadId: 'layer 1',
            value: 4
        });
    });
});

describe('simplad', function() {
    it('should apply unit in the correct order for several layers', function() {
        var monad = makeLayer().addMappings({
            a: testMonad.makeLayer(1),
            b: testMonad.makeLayer(2),
            c: testMonad.makeLayer(3)
        }).setLayerOrder(['a','b','c']);
        var res = monad.unit(43);
        expect(res).to.deep.equal({
            createdFrom: 'unit',
            deltas: [],
            monadId: 3,
            value: {
                createdFrom: 'unit',
                deltas: [],
                monadId: 2,
                value: {
                    createdFrom: 'unit',
                    deltas: [],
                    monadId: 1,
                    value: 43
                }
            }
        });
    });

    it('should allow the log to be written', function() {
        var monad = makeLayer().addMappings({
            layer1: testMonad.makeLayer('A'),
            layer2: testMonad.makeLayer('B')
        }).setLayerOrder(['layer1', 'layer2']);
        var obj = {};
        pipe(
                echo('input'),
                monad.unit,
                monad.bind(echo([ 'result', {} ])),
                set(obj, 'res')
            )();
        expect(obj.res).to.deep.equal({
            createdFrom: 'unit',
            delta: [[true]],
            monadId: 'B',
            value: {
                createdFrom: 'box',
                delta: [true],
                monadId: 'A',
                value: 'result'
            }
        });
    });

    it('should stop writing the log after maybe is false', function() {
        var monad = makeLayer().setLayerOrder(['maybe', 'writer']);
        var log = [];
        monad.layer('writer').registerListener(function(i) { log.push(i); });
        pipe(
                echo(3),
                monad.unit,
                monad.bind(echo([ 0, {writer: write(['this is correct'])} ])),
                monad.bind(echo([ 1, {writer: write(['this is also correct'])} ])),
                monad.bind(echo([ 2, {} ])),
                monad.bind(echo([ 3, {} ])),
                monad.bind(echo([ 4, {maybe: maybe.noValue} ])),
                monad.bind(echo([ 5, {writer: write(['this is NOT correct'])} ]))
            )();
        expect(log).to.deep.equal([
                'this is correct',
                'this is also correct'
        ]);
    });

    it('should stop writing the log after maybe is false layers reversed', function() {
        var monad = makeLayer().setLayerOrder(['writer', 'maybe']);
        var log = [];
        monad.layer('writer').registerListener(function(i) { log.push(i); });
        pipe(
                echo(3),
                monad.unit,
                monad.bind(echo([ 0, {writer: write(['this is correct'])} ])),
                monad.bind(echo([ 1, {writer: write(['this is also correct'])} ])),
                monad.bind(echo([ 2, {} ])),
                monad.bind(echo([ 3, {} ])),
                monad.bind(echo([ 4, {maybe: maybe.noValue} ])),
                monad.bind(echo([ 5, {writer: write(['this is NOT correct'])} ]))
            )();
        expect(log).to.deep.equal([
                'this is correct',
                'this is also correct'
        ]);
    });

    it('should write to three seperate writers', function() {
        var monad = makeLayer().addMappings({
            a: testMonad.makeLayer(1),
            b: testMonad.makeLayer(2),
            c: testMonad.makeLayer(3)
        }).setLayerOrder(['a','b','c','maybe']);
        var res = pipe(
                echo(3),
                monad.unit,
                monad.bind(echo([ 0, {a:1} ])),
                monad.bind(echo([ 0, {a:1, b:1} ])),
                monad.bind(echo([ 0, {b:1,c:1} ]))
                )();
        expect(res).to.deep.equal([
                true,
                {
                    createdFrom: 'box',
                    delta: 1,
                    monadId: 3,
                    value:{
                        createdFrom: 'box',
                        delta: 1,
                        monadId: 2,
                        value: {
                            createdFrom: 'box',
                            delta: [true],
                            monadId: 1,
                            value: 0
                        }
                    }
                }
        ]);
    });
});
