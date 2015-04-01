(function() {
    if (navigator.userAgent.indexOf("MSIE 8.0") > 0) {
        var frag = document.createDocumentFragment();
        frag.appendChild(document.createElement('storyboard'));
        frag.appendChild(document.createElement('animation'));
    }
}());
