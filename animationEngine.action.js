(function() {
    if (window.AE) {
        var engine = window.AE.engine;
        engine.Addhandler("discrete", function(discrete, getAttr) {
            var data = {
                value: getAttr(discrete, 'value')
            };
            return data;
        }, function(time, pre, data, next) {
            return {
                pass: true,
                value: data.data.value
            };
        });

        engine.Addhandler("easing", function(easing, getAttr) {
            var value = getAttr(easing, 'value');
            var data = {
                value: Number.parseInt(value),
            };
            return data;
        }, function(time, pre, data, next) {
            if (!next) {
                return {
                    pass: true,
                    value: data.data.value
                };
            }
            var result = {
                pass: next.time < time
            };
            if (next.time < time) {
                result.value = next.data.value;
            } else {
                result.value = data.data.value + (time - data.time) / (next.time - data.time) * (next.data.value - data.data.value);
            }
            return result;
        });

        engine.Addhandler("easingcolor", function(easing, getAttr) {
            var value = getAttr(easing, 'value');
            var data = {
                value: value,
                r: Number.parseInt(value.substr(0, 2), 16),
                g: Number.parseInt(value.substr(2, 2), 16),
                b: Number.parseInt(value.substr(4, 2), 16),
            };
            return data;
        }, function(time, pre, data, next) {
            if (!next) {
                return {
                    pass: true,
                    value: data.data.value
                };
            }
            var result = {
                pass: next.time < time
            };
            if (next.time < time) {
                result.value = next.data.value;
            } else {
                var r = data.data.r + (time - data.time) / (next.time - data.time) * (next.data.r - data.data.r);
                var g = data.data.g + (time - data.time) / (next.time - data.time) * (next.data.g - data.data.g);
                var b = data.data.b + (time - data.time) / (next.time - data.time) * (next.data.b - data.data.b);
                r = ("0" + Number.parseInt(r).toString(16)).slice(-2);
                g = ("0" + Number.parseInt(g).toString(16)).slice(-2);
                b = ("0" + Number.parseInt(b).toString(16)).slice(-2);
                result.value = r + g + b;
                console.log(result.value);
            }
            return result;
        });
    }
}());
