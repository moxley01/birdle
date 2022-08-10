// Mocks the Zustand middleware so that it no longer talks to localStorage

function _extends() {
    const _extends = Object.assign
        ? Object.assign.bind()
        : function (target) {
              for (var i = 1; i < arguments.length; i++) {
                  var source = arguments[i];

                  for (var key in source) {
                      if (Object.prototype.hasOwnProperty.call(source, key)) {
                          target[key] = source[key];
                      }
                  }
              }

              return target;
          };
    return _extends.apply(this, arguments);
}

export const redux = function reduxImpl(reducer, initial) {
    return function (set, get, api) {
        api.dispatch = function (action) {
            set(
                function (state) {
                    return reducer(state, action);
                },
                false,
                action
            );
            return action;
        };

        api.dispatchFromDevtools = true;
        return _extends(
            {
                dispatch: function dispatch() {
                    var _ref;

                    return (_ref = api).dispatch.apply(_ref, arguments);
                },
            },
            initial
        );
    };
};

export const persist = (input) => input;
