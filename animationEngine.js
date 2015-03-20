(function(global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = global.document ?
            factory(global) :
            function(w) {
                if (!w.document) {
                    throw new Error("AE requires a window with a document");
                }
                return factory(w);
            };
    } else {
        factory(global);
    }
}(typeof window !== "undefined" ? window : this, function(window) {
    var document = window.document,
        version = "0.0.1",
        engine = {},
        storyboards = {},
        Timer = {
            _isStop: false,
            _startTime: 0,
            _sbs: [],
            start: function(sb) {
                var _startTime = this._startTime,
                    now = new Date().getTime();
                if (sb) {
                    this._sbs.push({
                        timeoffset: now,
                        sb: sb
                    });
                }
                if (_startTime < 1) {
                    this._startTime = now;
                    this._interval = 1 / engine.expectFPS * 1000;
                    this._js = 0;
                    this.tick(0);
                }
            },
            stop: function(sb) {
                Timer._isStop = true;
            },
            tick: function(time) {
                if (Timer._isStop) return;
                Timer._js++;
                var now = new Date().getTime();

                for (var i = Timer._sbs.length - 1; i >= 0; i--) {
                    var sb = Timer._sbs[i];
                    var result = sb.sb._render(time ? time : now - sb.timeoffset);
                    if (result == false) {
                        Timer._sbs.splice(i, 1);
                    }
                };
                if (Timer._sbs.length > 0) {
                    setTimeout(Timer.tick, Timer._interval);
                } else {
                    console.log("avg FPS:" + Timer._js / (now - Timer._startTime) * 1000);
                    Timer._startTime = 0;
                }
            }
        };

    function getAttr(dom, attrName) {
        return dom.getAttribute(attrName);
    };

    function StoryBoard(sb, target) {
        this.animations = [];

        var anis = sb.children;
        for (var i = 0; i < anis.length; i++) {
            if (anis[i].tagName.toLowerCase() == "animation") {
                var acts = anis[i].children;
                var keyList = [];
                for (var j = 0; j < acts.length; j++) {
                    var type = acts[j].tagName.toLowerCase();
                    var handler = engine.aniHandlers[type];
                    if (handler) {
                        var prefix = getAttr(acts[j], 'prefix');
                        prefix = prefix ? prefix : "";
                        var suffix = getAttr(acts[j], 'suffix');
                        suffix = suffix ? suffix : "";
                        keyList.push({
                            time: Number.parseInt(getAttr(acts[j], 'time')),
                            prefix: prefix,
                            suffix: suffix,
                            process: handler.process,
                            data: handler.parse(acts[j], getAttr)
                        });
                    } else {
                        console.log("AE:" + type + "类型动画无法处理");
                    }
                };
                this.animations.push({
                    target: target ? target : getAttr(anis[i], 'target'),
                    property: getAttr(anis[i], 'property'),
                    keyList: keyList,
                });
            }
        };
    };

    function AE(sb, target) {
        if (typeof sb == "string") sb = document.getElementById(sb);
        if (typeof sb == "object") {
            storyboards[sb.id] = new StoryBoard(sb, target);
            return storyboards[sb.id];
        };
        return engine;
    };

    StoryBoard.prototype = {
        _render: function(time) {
            var Runtime = this.Runtime;

            for (var i = Runtime.animations.length - 1; i >= 0; i--) {
                var ani = Runtime.animations[i];
                for (var j = ani._renderIndex; j < ani.keyList.length; j++) {
                    var kl = ani.keyList[j];
                    if (kl.time <= time) {
                        var data = kl.process(time, j > 0 ? ani.keyList[j - 1] : null, kl, j < ani.keyList.length - 1 ? ani.keyList[j + 1] : null);
                        Runtime.idx[ani.target][ani.property] = ani.property + ":" + kl.prefix + data.value + kl.suffix;
                        var tmp = [];
                        for (var x in Runtime.idx[ani.target]) {
                            tmp.push(Runtime.idx[ani.target][x]);
                        }
                        document.getElementById(ani.target).style.cssText = ani._sourceStyle + tmp.join(';');
                        if (data.pass) {
                            ani._renderIndex++;
                        }
                    }
                    break;
                };
                if (ani.keyList.length == ani._renderIndex) {
                    Runtime.animations.splice(i, 1);
                }
            };
            if (Runtime.animations.length == 0) {
                return false;
            }
        },
        preRender: function() {},
        start: function() {
            delete this.Runtime;
            var Runtime = this.Runtime = {
                animations: this.animations.slice(0)
            };

            Runtime.idx = {};
            for (var i = 0; i < Runtime.animations.length; i++) {
                var ani = Runtime.animations[i];
                ani._renderIndex = 0;
                ani._sourceStyle = document.getElementById(ani.target).style.cssText;
                Runtime.idx[ani.target] = {};
            };
            Timer.start(this);
        },
        pause: function() {},
        stop: function() {
            Timer.stop(this);
        },
    };

    engine = AE.engine = {
        expectFPS: 60,
        aniHandlers: {},
        cache: function() {
            storyboards = [];
            sbs = document.getElementsByTagName('storyboard');
            for (var i = 0; i < sbs.length; i++) {
                storyboards[sbs[i].id] = new StoryBoard(sbs[i]);
            };
        },
        findStoryBoard: function(id) {
            if (typeof id == "object") id = sb.id;
            return storyboards[id];
        },
        Addhandler: function(type, parseFunc, processFunc) {
            this.aniHandlers[type] = {
                parse: parseFunc,
                process: processFunc
            };
        },
    };

    if (typeof define === "function" && define.amd) {
        define("ae", [], function() {
            return AE;
        });
    }

    var _AE = window.AE;

    AE.noConflict = function() {
        window.AE = _AE;
        return AE;
    };

    window.AE = AE;
    return AE;
}));
