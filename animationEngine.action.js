(function() {
    if (window.AE) {
        var engine = window.AE.engine;
        engine.Addhandler("discrete", true, function(time, dom, getAttr) {
            return {
                value: getAttr(dom, 'value')
            };
        }, function(time, pre, data, next) {
            return {
                pass: true,
                value: data.value
            };
        });

        engine.Addhandler("easing", false, function(time, dom, getAttr) {
            return {
                time: time,
                value: parseInt(getAttr(dom, 'value'))
            };
        }, function(time, pre, data, next) {
            if (!next) {
                return {
                    pass: true,
                    value: data.value
                };
            }
            var result = {
                pass: next.time < time
            };
            if (next.time < time) {
                result.value = next.value;
            } else {
                result.value = data.value + (time - data.time) / (next.time - data.time) * (next.value - data.value);
            }
            return result;
        });

        engine.Addhandler("easingcolor", false, function(time, dom, getAttr) {
            var value = getAttr(dom, 'value');
            return {
                time: time,
                value: value,
                r: parseInt(value.substr(0, 2), 16),
                g: parseInt(value.substr(2, 2), 16),
                b: parseInt(value.substr(4, 2), 16)
            };
        }, function(time, pre, data, next) {
            if (!next) {
                return {
                    pass: true,
                    value: data.value
                };
            }
            var result = {
                pass: next.time < time
            };
            if (next.time < time) {
                result.value = next.value;
            } else {
                var r = data.r + (time - data.time) / (next.time - data.time) * (next.r - data.r);
                var g = data.g + (time - data.time) / (next.time - data.time) * (next.g - data.g);
                var b = data.b + (time - data.time) / (next.time - data.time) * (next.b - data.b);
                r = ("0" + Math.round(r).toString(16)).slice(-2);
                g = ("0" + Math.round(g).toString(16)).slice(-2);
                b = ("0" + Math.round(b).toString(16)).slice(-2);
                result.value = r + g + b;
            }
            return result;
        });
    }
}());
