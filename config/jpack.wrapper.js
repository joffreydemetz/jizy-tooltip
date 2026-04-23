(function (global) {
    "use strict";

    if (typeof global !== "object" || !global || !global.document) {
        throw new Error("jTooltip requires a window and a document");
    }

    if (typeof global.jTooltip !== "undefined") {
        throw new Error("jTooltip is already defined");
    }

    // @CODE 

    global.jTooltip = Tooltip;

})(typeof window !== "undefined" ? window : this);