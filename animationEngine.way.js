(function(ae, document) {
    if (!ae) return;
    var Event = {
            addEvent: function(element, type, handler) {
                if (element.addEventListener) {
                    element.addEventListener(type, handler, false);
                } else if (element.attachEvent) {
                    element.attachEvent('on' + type, function() {
                        handler.call(element);
                    });
                } else {
                    element['on' + type] = handler;
                }
            },
            removeEvent: function(element, type, handler) {
                if (element.removeEventListener) {
                    element.removeEventListener(type, handler, false);
                } else if (element.datachEvent) {
                    element.detachEvent('on' + type, handler);
                } else {
                    element['on' + type] = null;
                }
            },
            stopPropagation: function(ev) {
                if (ev.stopPropagation) {
                    ev.stopPropagation();
                } else {
                    ev.cancelBubble = true;
                }
            },
            preventDefault: function(event) {
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
            },
            getTarget: function(event) {
                return event.target || event.srcElement;
            },
            getEvent: function(e) {
                var ev = e || window.event;
                if (!ev) {
                    var c = this.getEvent.caller;
                    while (c) {
                        ev = c.arguments[0];
                        if (ev && Event == ev.constructor) {
                            break;
                        }
                        c = c.caller;
                    }
                }
                return ev;
            }
        },
        way = ae.way = {
            _directives: [],
            _watchers: [],
            Scope: {},
            scan: function() {
                var directives = this._directives;

                for (var i = directives.length - 1; i >= 0; i--) {
                    var direct = directives[i];
                    var objs = document.querySelectorAll('[ae-' + direct.tag + ']');
                    for (var j = objs.length - 1; j >= 0; j--) {
                        obj = objs[j];
                        direct.init(obj, obj.getAttribute('ae-' + direct.tag));
                    };
                };
            }
        };

    way._directives.push({
        tag: "click",
        init: function(obj, arg) {
            var exppath = arg.split('.');
            Event.addEvent(obj, "click", function(e) {
                var obj = way.Scope;
                for (var i = 0; i < exppath.length - 1; i++) {
                    var path = exppath[i];
                    obj = obj[path];
                    if (!obj) {
                        return;
                    }
                };
                if (typeof obj == 'function') {
                    obj();
                }
            });
        }
    });

    way._directives.push({
        tag: "model",
        init: function(obj, arg) {
            var exppath = arg.split('.');
            way._watchers.push({
                exp: obj,
                get: function() {},
                last: {}
            });
        }
    });
}(window.AE, window.document));
