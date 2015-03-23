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
        _oldAE = window.AE,
        version = "0.0.5",
        rmsPrefix = /^-ms-/,
        rdashAlpha = /-([\da-z])/gi,
        fcamelCase = function(all, letter) {
            return letter.toUpperCase();
        },
        camelCase = function(string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        },
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
                if (sb) {
                    for (var i = this._sbs.length - 1; i >= 0; i--) {
                        if (sb == this._sbs[i]) {
                            this._sbs.splice(i, 1);
                            break;
                        }
                    };
                } else {
                    Timer._isStop = true;
                }
            },
            tick: function(time) {
                if (Timer._isStop) return;
                Timer._js++;
                var now = new Date().getTime();

                for (var i = Timer._sbs.length - 1; i >= 0; i--) {
                    var sb = Timer._sbs[i];
                    var result = sb.sb._render(time || now - sb.timeoffset);
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
                    var handler = engine._aniHandlers[type];
                    if (handler) {
                        var prefix = getAttr(acts[j], 'prefix');
                        prefix = prefix || "";
                        var suffix = getAttr(acts[j], 'suffix');
                        suffix = suffix || "";
                        var time = getAttr(acts[j], 'time');
                        keyList.push({
                            time: time,
                            prefix: prefix,
                            suffix: suffix,
                            handler: handler,
                            data: handler.parse(time, acts[j], getAttr)
                        });
                        //TODO 排序
                    } else {
                        console.log("AE:" + type + "类型动画无法处理");
                    }
                };

                var repeat = parseInt(getAttr(anis[i], 'repeat')) || 1;
                this.animations.push({
                    target: target || getAttr(anis[i], 'target'),
                    property: getAttr(anis[i], 'property'),
                    keyList: keyList,
                    repeat: repeat
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
                var ani = Runtime.animations[i],
                    vtime = time - ani._count * ani.keyList[ani.keyList.length - 1].time,
                    j = ani._renderIndex,
                    kl = ani.keyList[j];

                if (kl.time <= vtime) {
                    var data = kl.handler.process(vtime, j > 0 ? ani.keyList[j - 1].data : null, kl.data, j < ani.keyList.length - 1 ? ani.keyList[j + 1].data : null);
                    Runtime.idx[ani.targetid][ani.property] = kl.prefix + data.value + kl.suffix;
                    var tmp = [];
                    var target = ani.target;
                    for (var x in Runtime.idx[ani.targetid]) {
                        target.style[x] = Runtime.idx[ani.targetid][x];
                    }
                    if (data.pass) {
                        ani._renderIndex++;
                    }
                }
                if (ani.keyList.length == ani._renderIndex) {
                    ani.repeat--;
                    if (ani.repeat == 0) {
                        Runtime.animations.splice(i, 1);
                    } else {
                        ani._renderIndex = 0;
                        ani._count++;
                    }
                }
            };
            if (Runtime.animations.length == 0) {
                delete this.Runtime;
                return false;
            }
        },
        preRender: function(expectFPS) {
            delete this._preRenderRuntime;
            expectFPS = expectFPS || engine.expectFPS;
            var Runtime = this._preRenderRuntime = {
                    animations: this.animations.slice(0)
                },
                defaultHandler = engine._aniHandlers['discrete'],
                _interval = 1 / engine.expectFPS * 1000;
            if (!defaultHandler) {
                console.log('不能使用预渲染，缺少逐帧效果处理器');
                delete this._preRenderRuntime;
                return;
            }

            for (var i = 0; i < Runtime.animations.length; i++) {
                var ani = Runtime.animations[i];
                ani.targetid = ani.target;
                ani.target = document.getElementById(ani.target);
                ani.property = camelCase(ani.property);
                ani._renderIndex = 0;
                ani._count = 0;

                for (var j = 0, time = 0, nkl = [], kl; j < ani.keyList.length; time += _interval) {
                    kl = ani.keyList[j];
                    if (kl.handler.onlyOnTime && time < kl.time) continue;
                    var data = kl.handler.process(time, j > 0 ? ani.keyList[j - 1].data : null, kl.data, j < ani.keyList.length - 1 ? ani.keyList[j + 1].data : null);
                    nkl.push({
                        time: time,
                        prefix: kl.prefix,
                        suffix: kl.suffix,
                        handler: defaultHandler,
                        data: data
                    });
                    if (data.pass) {
                        j++;
                    }
                }
                ani.keyList = nkl;
            };
            return this;
        },
        start: function() {
            var Runtime = this.Runtime = {
                idx: {}
            };
            if (this._preRenderRuntime) {
                Runtime.animations = this._preRenderRuntime.animations.slice(0);
                for (var i = 0; i < Runtime.animations.length; i++) {
                    Runtime.idx[Runtime.animations[i].targetid] = {};
                };
                console.log('Using PreRender');
            } else {
                Runtime.animations = this.animations.slice(0);
                for (var i = 0; i < Runtime.animations.length; i++) {
                    var ani = Runtime.animations[i];
                    ani.targetid = ani.target;
                    ani.target = document.getElementById(ani.target);
                    ani.property = camelCase(ani.property);
                    ani._renderIndex = 0;
                    ani._count = 0;
                    Runtime.idx[ani.targetid] = {};
                };
                console.log('Using RealTimeRender');
            }
            Timer.start(this);
        },
        pause: function() {},
        stop: function() {
            Timer.stop(this);
        }
    };

    engine = AE.engine = {
        expectFPS: 64,
        _aniHandlers: {},
        cache: function() {
            storyboards = [];
            sbs = document.getElementsByTagName('storyboard');
            for (var i = 0; i < sbs.length; i++) {
                var sb = new StoryBoard(sbs[i]);
                storyboards[sbs[i].id] = sb;
                sb.preRender(this.expectFPS);
            };
        },
        findStoryBoard: function(id) {
            if (typeof id == "object") id = sb.id;
            return storyboards[id];
        },
        Addhandler: function(type, onlyOnTime, parseFunc, processFunc) {
            this._aniHandlers[type] = {
                onlyOnTime: onlyOnTime,
                parse: parseFunc,
                process: processFunc
            };
        },
        stop: function() {
            Timer.stop();
        }
    };

    if (typeof define === "function" && define.amd) {
        define("ae", [], function() {
            return AE;
        });
    }

    AE.noConflict = function() {
        window.AE = _oldAE;
        return AE;
    };

    window.AE = AE;
    return AE;
}));
