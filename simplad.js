if (true| 'imports' ) {
    var ramda = require('ramda');
    var curry = ramda.curry;

    // all monads must implement unit, bind and lift as usual
    // also they must implement box

    // box(delta, i) => unit(i) with modification delta
    // box = [default, ...]
}

exports.simplad = {};

// bound = [hasValue, value]
// delta = [isDefault]
exports.maybe = {
    unit: function(unbound) {
        return [
            true,
            unbound
        ];
    },

    bind: curry(function(func, bound) {
        if (bound[0]) {
            return func(bound[1]);
        }
        return bound;
    }),

    box: function(delta, unbound) {
        if (delta[0]) { // default
            return [true, unbound];
        }
        return [false, unbound];
    },

    lift: function(func) {
        return function(i) {
            return exports.maybe.unit(func(i));
        }
    },

    isFalse: function(unbound) {
        return [false, unbound];
    },

    noValue: [false]
}
