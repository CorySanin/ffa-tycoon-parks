(function () {
    var MAINWINDOWCLASS = 'ffaauthoringmain';
    var THUMBNAILWINDOWCLASS = 'ffaauthoringthumbnailer';
    var AUTHORSTEXTBOX = 'authorsTxt';
    var THUMBNAILVIEW = 'thumbnailView';
    var THUMBNAILLBL = 'thumbnailLbl';
    var ZOOMLBL = 'zoomLbl';
    var NAMESPACE = 'ffa-tycoon-authoring';
    var AUTHORSSTORE = 'authors';
    var THUMBSTORE = 'thumbnail';
    var mainWindow = {
        classification: MAINWINDOWCLASS,
        title: 'FFA Tycoon Map Authoring',
        width: 250,
        height: 99,
        colours: [12, 12],
        widgets: [
            {
                type: 'label',
                text: 'Authors (Comma separated):',
                x: 5,
                y: 19,
                width: 250,
                height: 14
            },
            {
                type: 'textbox',
                name: AUTHORSTEXTBOX,
                x: 5,
                y: 32,
                width: 240,
                height: 14,
                maxLength: 64
            },
            {
                type: 'button',
                name: 'authorSaveBtn',
                text: 'Save Authors',
                x: 5,
                y: 50,
                width: 110,
                height: 14,
                onClick: function () {
                    var _a;
                    var authors = (_a = ui.getWindow(MAINWINDOWCLASS).findWidget(AUTHORSTEXTBOX).text) === null || _a === void 0 ? void 0 : _a.split(',').map(function (author) { return author.trim(); }).filter(function (author) { return author.length > 0; });
                    context.getParkStorage().set(AUTHORSSTORE, (authors === null || authors === void 0 ? void 0 : authors.length) ? authors : undefined);
                    loadAuthorNames();
                }
            },
            {
                type: 'button',
                text: 'Adjust Thumbnail',
                x: 5,
                y: 80,
                width: 110,
                height: 14,
                onClick: createThumbnailWindow
            }
        ]
    };
    var thumbnailWindow = {
        classification: THUMBNAILWINDOWCLASS,
        title: 'FFA Tycoon Map Thumbnailer',
        width: 652,
        height: 418,
        colours: [13, 1],
        onUpdate: updateThumbnailPreview,
        widgets: [
            {
                type: 'viewport',
                name: THUMBNAILVIEW,
                x: 5,
                y: 18,
                width: 642,
                height: 362
            },
            {
                type: 'label',
                name: THUMBNAILLBL,
                x: 5,
                y: 384,
                width: 642,
                height: 14,
            },
            {
                type: 'button',
                text: 'Delete Saved Thumbnail',
                x: 326,
                y: 402,
                width: 158,
                height: 14,
                onClick: function () {
                    context.getParkStorage().set(THUMBSTORE, undefined);
                }
            },
            {
                type: 'button',
                text: 'Save Thumbnail',
                x: 489,
                y: 402,
                width: 158,
                height: 14,
                onClick: function () {
                    var vp = ui.getWindow(THUMBNAILWINDOWCLASS).findWidget(THUMBNAILVIEW);
                    var center = vp.viewport.getCentrePosition();
                    var thumb = {
                        rotation: vp.viewport.rotation,
                        zoom: vp.viewport.zoom,
                        x: center.x,
                        y: center.y
                    };
                    context.getParkStorage().set(THUMBSTORE, thumb);
                }
            },
            {
                type: 'label',
                name: ZOOMLBL,
                text: '{OUTLINE}{RED}Current zoom level not supported by screenshotter!',
                x: 5,
                y: 402,
                width: 316,
                height: 14,
                isVisible: false
            }
        ]
    };
    function updateThumbnailPreview() {
        var window = ui.getWindow(THUMBNAILWINDOWCLASS);
        var vp = window.findWidget(THUMBNAILVIEW);
        var mv = ui.mainViewport;
        vp.viewport.zoom = mv.zoom;
        var mult = getZoomMultiplier();
        vp.viewport.left = mult * (window.x + 6) + mv.left;
        vp.viewport.top = mult * (window.y + 19) + mv.top;
        var savedThumb = context.getParkStorage().get(THUMBSTORE, null);
        var savedText = savedThumb === null ? 'NULL' : "<r:".concat(savedThumb.rotation, ", z:").concat(savedThumb.zoom, ", x:").concat(savedThumb.x, ", y:").concat(savedThumb.y, ">");
        var center = vp.viewport.getCentrePosition();
        var currentView = "<r:".concat(mv.rotation, ", z:").concat(mv.zoom, ", x:").concat(center.x, ", y:").concat(center.y, ">");
        window.findWidget(ZOOMLBL).isVisible = mv.zoom < 0;
        window.findWidget(THUMBNAILLBL).text = "Saved: ".concat(savedText, " \u2014 Current: ").concat(currentView);
    }
    function getZoomMultiplier() {
        return Math.pow(2, ui.mainViewport.zoom);
    }
    function loadAuthorNames() {
        var loadedText = context.getParkStorage().get(AUTHORSSTORE, []).join(', ');
        ui.getWindow(MAINWINDOWCLASS).findWidget(AUTHORSTEXTBOX).text = loadedText;
    }
    function createMainWindow() {
        var window;
        if (window = ui.getWindow(MAINWINDOWCLASS)) {
            window.bringToFront();
        }
        else {
            ui.openWindow(mainWindow);
            loadAuthorNames();
        }
    }
    function createThumbnailWindow() {
        var window;
        if (window = ui.getWindow(THUMBNAILWINDOWCLASS)) {
            window.bringToFront();
        }
        else {
            ui.openWindow(thumbnailWindow);
        }
    }
    function main() {
        if (typeof ui === 'undefined' || network.mode !== 'none') {
            return;
        }
        ui.registerMenuItem('FFA Map Authoring', createMainWindow);
    }
    registerPlugin({
        name: NAMESPACE,
        version: '0.0.1',
        authors: ['Cory Sanin'],
        type: 'local',
        licence: 'MIT',
        targetApiVersion: 77,
        main: main
    });
})();
