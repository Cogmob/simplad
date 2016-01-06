/*  imports  */
if (true) {
    var ramda = require('ramda');
    var curry = ramda.curry;
    var reduce = ramda.reduce;
    var map = ramda.map;
    var pipe = ramda.pipe;
    var reverse = ramda.reverse;
    var clone = ramda.clone;
    var copy = require('shallow-copy');
    function print(i) { console.log(JSON.stringify(i,null,1)); return i; }
}

/*  simplad  */
function simplad() {
    return {
        makeLayer: makeLayer
    };

    function makeLayer() {
        var ret = {};

        ret.layerOrder = [];
        ret.layerTable = reduce(function(acc, monadName) {
            if (!exports[monadName].hasOwnProperty('makeLayer')) {
                return acc;
            }

            if (monadName === 'simplad') {
                return acc;
            }

            acc[monadName] = {
                name: monadName,
                monad: exports[monadName].makeLayer()
            };

            return acc;
        }, {}, Object.keys(exports));

        ret.addMappings = addMappings(ret),
        ret.setLayerOrder = setLayerOrder(ret),

        ret.unit = unit(ret),
        ret.bind = bind(ret),

        ret.layer = layer(ret)
            ret.applyDeltas = applyDeltas(ret);

        return ret;
    }

    function unit(t) {
        return function(i) {
            return reduce(
                    function(acc,layer) {
                        return layer.monad.unit(acc);
                    }, i, t.layerOrder);
        }
    };

    function bind(t) {
        return curry(function(func, boundBefore) {
            var rev = clone(t.layerOrder);
            return applyBinds({
                layerOrder: rev,
                func: func,
                boundBefore: boundBefore
            });
        });
    };

    function applyBinds(i) {
        return reduce(function(acc, layer) {
            return layer.monad.bind(acc);
        }, i.func, i.layerOrder)(i.boundBefore);
    };

    function applyDeltas(t) {
        return function(deltaAfter) {
            return t.box(
                    deltaAfter[0],
                    deltaAfter[1],
                    clone(t.layerOrder));
        };
    };

    function box(t) {
        return function(afterVal, afterDeltas, layerOrder) {
            var layer = layerOrder.pop();
            if (layerOrder.length > 0) {
                afterVal = t.box(afterVal, afterDeltas, layerOrder);
            }
            var delta = afterDeltas.hasOwnProperty(layer.name) ?
                afterDeltas[layer.name] : [true];
            return layer.monad.box(delta, afterVal);
        };
    };

    function addMappings(t) {
        return function addMappings(mappings) {
            layerTable = reduce(function(acc, key) {
                acc[key] = {
                    name: key,
                    monad: mappings[key]
                };
                return acc;
            }, t.layerTable, Object.keys(mappings));
            return t;
        };
    };

    function setLayerOrder(t) {
        return function(layerOrderStrings) {
            t.layerOrder = reduce(function(acc, name) {
                acc.push(t.layerTable[name]);
                return acc;
            }, [], layerOrderStrings);
            return t;
        };
    }

    function layer(t) {
        return function(name) {
            if (!t.layerTable.hasOwnProperty(name)) {
                throw('layer not found');
            }
            return t.layerTable[name].monad;
        };
    };
};

/*  monads  */
function maybe() {
    /* bound = [hasValue, value]
       delta = [isDefault] */
    return {
        makeLayer: makeLayer,
        isFalse: isFalse
    };

    function makeLayer() {
        var ret = {};
        ret.unit = unit;
        ret.bind = curry(bind);
        return ret;
    }

    function unit(unbound) {
        return [
            true,
            unbound
        ];
    }

    function bind(func, boundBefore) {
        var hasValue = boundBefore[0];
        var unboundBefore = boundBefore[1];
        if (!hasValue) {
            return [false,null,null];
        }

        var res = func(unboundBefore);
        var unboundAfter = res[0];
        var delta = res[1];
        var deltas = res[2];

        hasValue = delta[0];

        if (hasValue) {
            return [false, null, null];
        }
        return [[true, unboundAfter], otherDeltas];
    }

    function isFalse(unbound) {
        return [false];
    }
};

function log() {
    /* bound = [value, [logs...]]
       delta = [isDefault, [new logs...]] */
    return {
        makeLayer: makeLayer,
        hasLog: hasLog,
        noLog: noLog,
        setParamToLog: setParamToLog
    };

    function makeLayer() {
        return {
            unit: unit,
            bind: curry(bind)
        }
    }

    function unit(unbound) {
        return [unbound, []];
    }

    function bind(func, boundBefore) {
        var res = func(boundBefore[0]);
        var newLogs = res[1];
        if (newLogs.length>0)  {
            newLogs = boundBefore[1].concat(newLogs);
        } else {
            newLogs = boundBefore[1];
        }
        return [res[0], newLogs];
    }

    function hasLog(logs) {
        return [false, logs];
    }

    function noLog(i) {
        return [true];
    }

    function setParamToLog(obj, key) {
        return function(i) {
            obj[key] = i[1];
            return i;
        }
    }
};

function writer() {
    return {
        makeLayer: makeLayer,
        write: write
    };

    function makeLayer() {
        var ret = {};
        ret.unit = unit;
        ret.bind = curry(bind(ret));
        ret.listeners = [];
        ret.sendLogs = sendLogs(ret);
        ret.sendLog = sendLog(ret);
        ret.registerListener = registerListener(ret);
        return ret;
    }

    function unit(i) {
        return i;
    }

    function bind(layer) {
        return function(func, boundBefore) {
            var res = func(boundBefore);
            var delta = res[1];
            layer.sendLogs(delta[1]);
            return res[0];
        };
    }

    function sendLogs(layer) {
        return function(logs) {
            map(function(log) {
                layer.sendLog(log);
            },
            logs);
        };
    }

    function sendLog(layer) {
        return function(log) {
            map(function(listener) {
                listener(log);
            }, layer.listeners);
        };
    }

    function registerListener(layer) {
        return function(listener) {
            layer.listeners.push(listener);
        };
    }

    function write(log) {
        return [false, [log]];
    }
}

/*  final processing  */
if (true) {
    exports.simplad = simplad();
    exports.maybe = maybe();
    exports.log = log();
    exports.writer = writer();

    exports.lift = function(func) {
        return function(i) {
            return [func(i), [true]];
        }
    };

    map(function(monad) {
        exports[monad].name = monad;
    }, Object.keys(exports));
}
