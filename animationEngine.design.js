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
        Objects = {};

    ae.design = {
        _panel: null,
        _timePanel: null,
        _workspace: null,
        _lastover: null,
        _target: null,
        onmouseover: function(e) {
            var target = Event.getTarget(e);
            var ts = target.style;
            ts.backgroundColor = "rgba(255, 0, 0, 0.25)";
            ts.boxShadow = "5px 5px 3px #888888";
            ts.outline = "red solid 1px";
            ts.cursor = "pointer";
            ae.design._lastover = target;
        },
        onmouseout: function(e) {
            var target = Event.getTarget(e);
            var ts = target.style;
            ts.backgroundColor = "";
            ts.boxShadow = "";
            ts.outline = "";
            ts.cursor = "";
        },
        onclick: function(e) {
            var target = this._target = Event.getTarget(e);
            document.getElementById('designTarget').innerHTML = e.target.tagName;
            document.getElementById('designTargetId').innerHTML = e.target.id ? e.target.id : '无';
        },
        init: function(dom) {
            if (this._workspace) return;
            this._panel = document.getElementById('designPanel');
            this._timePanel = document.getElementById('designTimePanel');
            if (typeof dom == "string") dom = document.getElementById(dom);
            Event.addEvent(dom, 'mouseover', this.onmouseover);
            Event.addEvent(dom, 'mouseout', this.onmouseout);
            Event.addEvent(dom, 'click', this.onclick);
            this._workspace = dom;

            this._panel.style.display = 'block';
            this._timePanel.style.display = 'block';
        },
        close: function() {
            if (!this._workspace) return;
            Event.removeEvent(this._workspace, 'mouseover', this.onmouseover);
            Event.removeEvent(this._workspace, 'mouseout', this.onmouseout);
            Event.removeEvent(this._workspace, 'click', this.onclick);
            if (this._lastover) {
                this.onmouseout({
                    target: this._lastover
                });
            }
            this._workspace = null;
            this._panel.style.display = 'none';
            this._timePanel.style.display = 'none';
        }
    };
}(window.AE, window.document));
