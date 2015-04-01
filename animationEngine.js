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
        _tmpObjId = 0,
        version = "0.0.5",
        rmsPrefix = /^-ms-/,
        rdashAlpha = /-([\da-z])/gi,
        fcamelCase = function(all, letter) {
            return letter.toUpperCase();
        },
        camelCase = function(string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        },
        querySelectorAll = (function() {
            if (document.querySelectorAll) {
                return function(selector) {
                    return document.querySelectorAll(selector);
                };
            } else if (window.jQuery) {
                return function(selector) {
                    return window.jQuery(selector);
                };
            } else {
                return function() {
                    console.log('Err,无法使用查询');
                };
            }
        }()),
        storyboards = {},
        Timer = {
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
            pause: function(sb) {
                //TODO 暂停逻辑
            },
            stop: function(sb) {
                for (var i = this._sbs.length - 1; i >= 0; i--) {
                    var _sb = this._sbs[i].sb;
                    if (sb && sb !== _sb) {
                        continue;
                    }
                    for (var j = _sb.animations.length - 1; j >= 0; j--) {
                        var _ani = _sb.animations[j];
                        _ani.keyList = [_ani.keyList.pop()];
                        _ani.keyList[0].time = 0;
                        _ani._renderIndex = 0;
                        _ani.repeat = 1;
                    }
                }
            },
            tick: function(time) {
                Timer._js++;
                var now = new Date().getTime();
                for (var i = Timer._sbs.length - 1; i >= 0; i--) {
                    var sb = Timer._sbs[i];
                    var result = sb.sb._render(time || now - sb.timeoffset);
                    if (result === false) {
                        Timer._sbs.splice(i, 1);
                    }
                }
                if (Timer._sbs.length > 0) {
                    setTimeout(Timer.tick, Timer._interval);
                } else {
                    console.log("avg FPS:" + Timer._js / (now - Timer._startTime) * 1000);
                    Timer._startTime = 0;
                }
            }
        },
        engine = AE.engine = {
            expectFPS: 64,
            _aniHandlers: {},
            cache: function() {
                storyboards = [];
                var sbs = document.getElementsByTagName('storyboard');
                for (var i = 0; i < sbs.length; i++) {
                    var sb = new StoryBoard(sbs[i]);
                    storyboards[sbs[i].id] = sb;
                    sb.preRender(this.expectFPS);
                }
            },
            findStoryBoard: function(id) {
                if (typeof id === "object") {
                    if (typeof id.id !== "string") {
                        return null;
                    }
                    id = id.id;
                }
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
            },
            pause: function() {
                Timer.pause();
            }
        };

    function getAttr(dom, attrName) {
        return dom.getAttribute(attrName);
    }

    function StoryBoard(sb, target) {
        var animations = this.animations = [],
            i, j, ani, keyList;

        if (sb.tagName) {
            var anis = sb.children;
            for (i = 0; i < anis.length; i++) {
                ani = anis[i];
                if (ani.tagName.toLowerCase() === "animation") {
                    var acts = ani.children,
                        targets = target || getAttr(ani, 'target'),
                        property = getAttr(ani, 'property');

                    keyList = [];
                    for (j = 0; j < acts.length; j++) {
                        var type = acts[j].tagName.toLowerCase();
                        var handler = engine._aniHandlers[type];
                        if (handler) {
                            var prefix = getAttr(acts[j], 'prefix');
                            prefix = prefix || "";
                            var suffix = getAttr(acts[j], 'suffix');
                            suffix = suffix || "";
                            var time = parseInt(getAttr(acts[j], 'time') || 0);
                            keyList.push({
                                time: time,
                                prefix: prefix,
                                suffix: suffix,
                                handler: handler,
                                data: (function(handler, paramData, getFunc) {
                                    return function(time) {
                                        return handler.parse(time, paramData, getFunc);
                                    };
                                }(handler, acts[j], getAttr))
                            });
                            //TODO 稳定排序
                        } else {
                            console.log("AE:" + type + "类型动画无法处理");
                        }
                    }

                    if (!targets || !property) continue;
                    animations.push({
                        targets: targets,
                        property: property,
                        keyList: keyList,
                        repeat: parseInt(getAttr(ani, 'repeat')) || 1,
                        reverse: getAttr(ani, 'reverse')
                    });
                }
            }
        } else if (sb instanceof Array) {
            animations.push.apply(animations, sb);
            //TODO 预处理key.Data的paramData, getFunc
        }

        for (i = animations.length - 1; i >= 0; i--) {
            ani = animations[i],
                keyList = ani.keyList;
            ani.property = camelCase(ani.property);
            if (ani.reverse) {
                for (j = keyList.length - 2; j >= 0; j--) {
                    var tmpObj = {};
                    var tmpkl = keyList[j];
                    for (var p in tmpkl) {
                        tmpObj[p] = tmpkl[p];
                    }
                    var pretime = keyList[keyList.length - 1].time;
                    tmpObj.time = pretime + (pretime - tmpObj.time);
                    keyList.push(tmpObj);
                }
            }
            for (j = keyList.length - 1; j >= 0; j--) {
                var key = keyList[j];
                key.data = key.data(key.time);
            }
        }
    }

    function AE(sb, targets) {
        switch (typeof targets) {
            case "undefined":
                break;
            case "string":
                targets = querySelectorAll(targets);
                break;
            case "object":
                targets = [targets];
                break;
            case "array":
                //TODO 检查组内对象
                break;
            default:
                return null;
        }
        if (typeof sb === "string") sb = document.getElementById(sb);
        if (typeof sb === "object") {
            //TODO sb为JSON对象
            if (sb.tagName.toLowerCase() !== 'storyboard') return null;
            storyboards[sb.id] = new StoryBoard(sb, targets);
            return storyboards[sb.id];
        }
        return engine;
    }

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
                    for (var k = 0, atLength = ani.targets.length; k < atLength; k++) {
                        var target = ani.targets[k];
                        Runtime.idx[target.id][ani.property] = kl.prefix + data.value + kl.suffix;
                        var tmpidx = Runtime.idx[target.id];
                        for (var attr in tmpidx) {
                            target.style[attr] = tmpidx[attr];
                        }
                    }
                    if (data.pass) {
                        ani._renderIndex++;
                    }
                }
                if (ani.keyList.length === ani._renderIndex) {
                    ani.repeat--;
                    if (ani.repeat === 0) {
                        Runtime.animations.splice(i, 1);
                    } else {
                        ani._renderIndex = 0;
                        ani._count++;
                    }
                }
            }
            if (Runtime.animations.length === 0) {
                delete this.Runtime;
                return false;
            }
        },
        preRender: function(expectFPS) {
            delete this._preRenderRuntime;
            expectFPS = expectFPS || engine.expectFPS;
            var Runtime = this._preRenderRuntime = {
                idx: {},
                animations: this.animations.slice(0)
            };
            var defaultHandler = engine._aniHandlers.discrete,
                _interval = 1 / engine.expectFPS * 1000;
            if (!defaultHandler) {
                console.log('不能使用预渲染，缺少逐帧效果处理器');
                delete this._preRenderRuntime;
                return;
            }

            for (var i = Runtime.animations.length - 1; i >= 0; i--) {
                var ani = Runtime.animations[i];
                if (typeof ani.targets === 'string') {
                    ani.targets = querySelectorAll(ani.targets);
                }
                if (ani.targets.length <= 0) {
                    Runtime.animations.splice(i, 1);
                    continue;
                }
                for (var k = ani.targets.length - 1; k >= 0; k--) {
                    if (!ani.targets[k].id) {
                        ani.targets[k].id = "_AEO_" + _tmpObjId;
                    }
                    Runtime.idx[ani.targets[k].id] = {};
                }
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
            }
            return this;
        },
        start: function() {
            var Runtime = this.Runtime = {
                idx: {}
            };
            if (this._preRenderRuntime) {
                Runtime.animations = this._preRenderRuntime.animations.slice(0);
                var nidx = {};
                var tmpidx = this._preRenderRuntime.idx;
                for (var id in tmpidx) {
                    nidx[id] = {};
                }
                Runtime.idx = nidx;
                console.log('Using PreRender');
            } else {
                Runtime.animations = this.animations.slice(0);
                for (var i = Runtime.animations.length - 1; i >= 0; i--) {
                    var ani = Runtime.animations[i];
                    if (typeof ani.targets === 'string') {
                        ani.targets = querySelectorAll(ani.targets);
                    }
                    if (ani.targets.length <= 0) {
                        Runtime.animations.splice(i, 1);
                        continue;
                    }
                    for (var k = ani.targets.length - 1; k >= 0; k--) {
                        if (!ani.targets[k].id) {
                            ani.targets[k].id = "_AEO_" + _tmpObjId;
                        }
                        Runtime.idx[ani.targets[k].id] = {};
                    }
                    ani._renderIndex = 0;
                    ani._count = 0;
                }
                console.log('Using RealTimeRender');
            }
            Timer.start(this);
        },
        pause: function() {
            Timer.pause(this);
        },
        stop: function() {
            Timer.stop(this);
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
