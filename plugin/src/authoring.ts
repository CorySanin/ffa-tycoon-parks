/// <reference path="../types/openrct2.d.ts" />
/// <reference path="../types/common.d.ts" />

(function () {
    const MAINWINDOWCLASS = 'ffaauthoringmain';
    const THUMBNAILWINDOWCLASS = 'ffaauthoringthumbnailer';
    const AUTHORSTEXTBOX = 'authorsTxt';
    const THUMBNAILVIEW = 'thumbnailView';
    const THUMBNAILLBL = 'thumbnailLbl';
    const ZOOMLBL = 'zoomLbl';
    const NAMESPACE = 'ffa-tycoon-authoring';
    const AUTHORSSTORE = 'authors';
    const THUMBSTORE = 'thumbnail';

    const mainWindow: WindowDesc = {
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
                onClick: () => {
                    const authors: string[] | undefined = (ui.getWindow(MAINWINDOWCLASS).findWidget(AUTHORSTEXTBOX) as TextBoxDesc).text?.split(',')
                        .map(author => author.trim())
                        .filter(author => author.length > 0);
                    context.getParkStorage().set(AUTHORSSTORE, authors?.length ? authors : undefined);
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
    }

    const thumbnailWindow: WindowDesc = {
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
                // 1px border, +2 in each dimension:
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
                onClick: () => {
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
                onClick: () => {
                    const vp = (ui.getWindow(THUMBNAILWINDOWCLASS).findWidget(THUMBNAILVIEW) as ViewportWidget);
                    const center = vp.viewport.getCentrePosition();
                    const thumb: Thumbnail = {
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
    }

    function updateThumbnailPreview() {
        const window = ui.getWindow(THUMBNAILWINDOWCLASS);
        const vp = (window.findWidget(THUMBNAILVIEW) as ViewportWidget);
        const mv = ui.mainViewport;
        vp.viewport.zoom = mv.zoom;
        const mult = getZoomMultiplier();
        vp.viewport.left = mult * (window.x + 6) + mv.left;
        vp.viewport.top = mult * (window.y + 19) + mv.top;
        const savedThumb: Thumbnail | null = context.getParkStorage().get(THUMBSTORE, null as Thumbnail | null);
        const savedText = savedThumb === null ? 'NULL' : `<r:${savedThumb.rotation}, z:${savedThumb.zoom}, x:${savedThumb.x}, y:${savedThumb.y}>`;
        const center = vp.viewport.getCentrePosition();
        const currentView = `<r:${mv.rotation}, z:${mv.zoom}, x:${center.x}, y:${center.y}>`;
        window.findWidget(ZOOMLBL).isVisible = mv.zoom < 0;
        (window.findWidget(THUMBNAILLBL) as LabelWidget).text = `Saved: ${savedText} — Current: ${currentView}`;
    }

    function getZoomMultiplier(): number {
        return Math.pow(2, ui.mainViewport.zoom);
    }

    function loadAuthorNames() {
        const loadedText = (context.getParkStorage().get(AUTHORSSTORE, []) as string[]).join(', ');
        (ui.getWindow(MAINWINDOWCLASS).findWidget(AUTHORSTEXTBOX) as TextBoxWidget).text = loadedText;
    }

    function createMainWindow() {
        let window: Window;
        if (window = ui.getWindow(MAINWINDOWCLASS)) {
            window.bringToFront();
        }
        else {
            ui.openWindow(mainWindow);
            loadAuthorNames();
        }
    }

    function createThumbnailWindow() {
        let window: Window;
        if (window = ui.getWindow(THUMBNAILWINDOWCLASS)) {
            window.bringToFront();
        }
        else {
            ui.openWindow(thumbnailWindow);
        }
    }

    function main(): void {
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
        main
    });
})();