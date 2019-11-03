var EventUtil = {};
EventUtil.isNonPrintableOrControlKeyPressed = function (e) {
    return !!(e.which < 32 || e.ctrlKey || e.metaKey || e.altKey)
}
EventUtil.isNumberPressed = function (n, r) {
    var i = r || new RegExp("[0-9]");
    var a = String.fromCharCode(n.which | n.keyCode | n.charCode);
    return i.test(a) || i.test(e.parseEasternNumber(a))
}

var KeyCodes = {
    BACK_SPACE: 8,
    DELETE: 46,
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
    V: 86
}

// {{999}}-{{999}}-{{999}}

function Formatter(jqElem, pattern) {
    function o() {
        var currentCursorPos = self.getCursorPos();
        var t = self.getModelValue(self.getViewValue().substr(0, currentCursorPos));
        self.format();
        var n = self.formatString(t);
        self.setCursorPos(n.length)
    }

    var self = this;
    this.elem = jqElem;
    this.contentPattern = /\d/;
    this.expectedLength = 0;
    this.setPattern(pattern);
    jqElem.data("formatter", self);

    jqElem.on("keydown", function (e) {
        var t = self.getKeyCode(e);
        var n = self.getChar(t);
        var r = self.getCursorPos();
        var i = self.getViewValue();
        var a = self.calcCursorForDeletion(t, r, i);

        !self.isKeyCodeArrow(t) || e.ctrlKey || e.shiftKey || (a = self.calcCursorForMovement(t, r, i)),
        a !== r && self.setCursorPos(a);

        var o = i.length;
        self.expectedLength <= o && self.contentPattern.test(n) && r === o && e.preventDefault()
    });

    jqElem.on("keypress", function (t) {
        EventUtil.isNonPrintableOrControlKeyPressed(t) || EventUtil.isNumberPressed(t, self.contentPattern) || t.preventDefault()
    });

    jqElem.on("paste", function () {
        setTimeout(function () {
            o()
        })
    });

    jqElem.on("keyup", function (e) {
        var n = self.getKeyCode(e)
            , r = self.getChar(n);
        (self.contentPattern.test(r) || n === KeyCodes.BACK_SPACE || n === KeyCodes.DELETE) && o()
    })
}

Formatter.prototype.calcCursorForDeletion = function (keycode, currentCursorPos, text) {
    if (keycode === KeyCodes.BACK_SPACE && currentCursorPos > 0) {
        if (this.isSeparator(text[currentCursorPos - 1])) {
            return currentCursorPos - 1
        }
    } else if (keycode === KeyCodes.DELETE && currentCursorPos < text.length) {
        if (this.isSeparator(text[currentCursorPos])) {
            return currentCursorPos + 1
        }
    }
    return currentCursorPos
};

Formatter.prototype.calcCursorForMovement = function (keycode, currentCursorPos, text) {
    if (keycode === KeyCodes.RIGHT_ARROW) {
        if (this.isSeparator(text[currentCursorPos])) {
            return currentCursorPos + 1
        }
    } else if (currentCursorPos >= 2 && this.isSeparator(text[currentCursorPos - 2])) {
        return currentCursorPos - 1;
    }

    return currentCursorPos;
};

Formatter.prototype.isSeparator = function (value) {
    this.separatorPattern.lastIndex = 0;
    return this.separatorPattern.test(value)
};

Formatter.prototype.buildSeparatorPattern = function (pattern) {
    var finalText = pattern.replace(/{{.*?}}/g, "").split("").reduce(function (result, current) {
        if (result.indexOf(current) === -1) {
            if ("-" === current) {
                current = "\\" + current
            }
            result += current;
        }
        return result;
    }, "");
    return new RegExp("[" + finalText + "]", "g")
};

Formatter.prototype.getKeyCode = function (e) {
    var code = e.keyCode || e.charCode;
    if (0 === code || 229 === code) {
        var text = this.getViewValue();
        code = text.substr(text.length - 1).charCodeAt()
    }
    return code
};

Formatter.prototype.isKeyCodeArrow = function (keyCode) {
    return keyCode === KeyCodes.LEFT_ARROW || keyCode === KeyCodes.RIGHT_ARROW
};

Formatter.prototype.setViewValue = function (text) {
    this.elem.val(text)
};

Formatter.prototype.setCursorPos = function (pos) {
    var element = this.elem[0];
    if (element.selectionStart === element.selectionEnd) {
        element.selectionStart = pos;
        element.selectionEnd = pos;
    } else {
        element.selectionStart = pos;
    }
};

Formatter.prototype.getCursorPos = function () {
    return this.elem[0].selectionStart
};

Formatter.prototype.getViewValue = function () {
    return this.elem.val()
};

Formatter.prototype.getModelValue = function (text) {
    if (!text) {
        text = this.elem.val() || "";
    }
    return text.replace(this.separatorPattern, "");
};

Formatter.prototype.setModelValue = function (e) {
    this.elem.val(e);
    this.format();
};

Formatter.prototype.setPattern = function (pattern) {
    this.pattern = pattern;
    this.expectedLength = pattern.replace(/[\{\}]/g, "").length;
    this.separatorPattern = this.buildSeparatorPattern(pattern);
    this.format();
};

Formatter.prototype.format = function () {
    var formattedString = this.formatString(this.getModelValue());
    this.setViewValue(formattedString)
};

Formatter.prototype.getChar = function (e) {
    return e >= 96 && e <= 105 ? (e - 96).toString() : String.fromCharCode(e)
};


Formatter.prototype.formatString = function (rawText) {
    var formattedChars = [];
    var rawTextChars = rawText.split("");
    var patternChars = this.pattern.split("");

    while (patternChars.length > 0 && rawTextChars.length > 0) {
        var patternChar = patternChars.shift();
        if ("{" !== patternChar && "}" !== patternChar) {
            if (this.isSeparator(patternChar)) {
                formattedChars.push(patternChar)
            } else {
                formattedChars.push(rawTextChars.shift())
            }
        }
    }
    return formattedChars.join("")
};
