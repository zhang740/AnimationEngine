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
            var data = {
                value: getAttr(easing, 'value')
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
                var num = Number.parseInt(data.data.value) + (time - data.time) / (next.time - data.time) * (Number.parseInt(next.data.value) - Number.parseInt(data.data.value));
                result.value = num;
            }
            return result;
        });
    }
}());
