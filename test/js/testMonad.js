/* imports */
if (true) {
    var ramda = require('ramda');
    var curry = ramda.curry;
    function print(i) { console.log(JSON.stringify(i,null,1)); return i; }
}

exports.monad = function() {
    return {
        makeLayer: makeLayer
    };

    function makeLayer(monadId) {
        ret = {};
        ret.monadId = monadId;
        ret.unit = unit(ret);
        ret.bind = bind(ret);
        return ret;
    };

    function unit(layer) {
        return function(unbound) {
            return {
                monadId: layer.monadId,
                value: unbound,
                deltas: [],
                createdFrom: 'unit'
            };
        };
    }

    function bind(layer) {
        return curry(function(func, bound) {
            var res = func(bound.value);
            var delta = res[1];
            if (!delta[0]) {
                bound.deltas.push(delta[1]);
            }
            bound.createdFrom = 'bind';
            bound.value = res[0];
            return bound;
        });
    }
}
