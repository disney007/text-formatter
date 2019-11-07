"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var KeyCode;
(function (KeyCode) {
    KeyCode[KeyCode["BACK_SPACE"] = 8] = "BACK_SPACE";
    KeyCode[KeyCode["DELETE"] = 46] = "DELETE";
    KeyCode[KeyCode["LEFT_ARROW"] = 37] = "LEFT_ARROW";
    KeyCode[KeyCode["RIGHT_ARROW"] = 39] = "RIGHT_ARROW";
})(KeyCode || (KeyCode = {}));
var TextFormatter = /** @class */ (function () {
    function TextFormatter(elem, pattern, contentPattern) {
        var _this = this;
        if (contentPattern === void 0) { contentPattern = /\d/; }
        this.elem = elem;
        this.contentPattern = contentPattern;
        this.expectedLength = 0;
        this.pattern = '';
        this.setPattern(pattern);
        elem.addEventListener('keydown', function (e) {
            var keycode = _this.getKeyCode(e);
            var char = _this.getChar(keycode);
            var cursorPos = _this.getCursorPos();
            var viewValue = _this.getViewValue();
            var nextCursorPos = _this.calcCursorForDeletion(keycode, cursorPos, viewValue);
            if (_this.isKeyCodeArrow(keycode) && !e.ctrlKey && !e.shiftKey) {
                nextCursorPos = _this.calcCursorForMovement(keycode, cursorPos, viewValue);
            }
            if (nextCursorPos !== cursorPos) {
                _this.setCursorPos(nextCursorPos);
            }
            var currentLength = viewValue.length;
            if (_this.expectedLength <= currentLength && _this.contentPattern.test(char) && cursorPos === currentLength) {
                e.preventDefault();
            }
        });
        elem.addEventListener("keypress", function (e) {
            var char = String.fromCharCode(e.which | e.keyCode | e.charCode);
            if (!_this.contentPattern.test(char)) {
                e.preventDefault();
            }
        });
        elem.addEventListener("paste", function () {
            setTimeout(function () { return _this.update(); });
        });
        elem.addEventListener("keyup", function (e) {
            var keycode = _this.getKeyCode(e);
            var char = _this.getChar(keycode);
            if (_this.contentPattern.test(char) || keycode === KeyCode.BACK_SPACE || keycode === KeyCode.DELETE) {
                _this.update();
            }
        });
    }
    TextFormatter.prototype.update = function () {
        var currentCursorPos = this.getCursorPos();
        var modelValue = this.getModelValue(this.getViewValue().substr(0, currentCursorPos));
        this.format();
        var cursorPos = this.formatString(modelValue);
        this.setCursorPos(cursorPos.length);
    };
    TextFormatter.prototype.calcCursorForDeletion = function (keycode, currentCursorPos, text) {
        if (keycode === KeyCode.BACK_SPACE && currentCursorPos > 0) {
            if (this.isSeparator(text[currentCursorPos - 1])) {
                return currentCursorPos - 1;
            }
        }
        else if (keycode === KeyCode.DELETE && currentCursorPos < text.length) {
            if (this.isSeparator(text[currentCursorPos])) {
                return currentCursorPos + 1;
            }
        }
        return currentCursorPos;
    };
    ;
    TextFormatter.prototype.calcCursorForMovement = function (keycode, currentCursorPos, text) {
        if (keycode === KeyCode.RIGHT_ARROW) {
            if (this.isSeparator(text[currentCursorPos])) {
                return currentCursorPos + 1;
            }
        }
        else if (currentCursorPos >= 2 && this.isSeparator(text[currentCursorPos - 2])) {
            return currentCursorPos - 1;
        }
        return currentCursorPos;
    };
    ;
    TextFormatter.prototype.isSeparator = function (value) {
        this.separatorPattern.lastIndex = 0;
        return this.separatorPattern.test(value);
    };
    ;
    TextFormatter.prototype.buildSeparatorPattern = function (pattern) {
        var finalText = pattern
            .replace(/{{.*?}}/g, "")
            .split("")
            .reduce(function (result, current) {
            if (result.indexOf(current) === -1) {
                if ("-" === current) {
                    current = "\\" + current;
                }
                result += current;
            }
            return result;
        }, "");
        return new RegExp("[" + finalText + "]", "g");
    };
    ;
    TextFormatter.prototype.getKeyCode = function (e) {
        var code = e.keyCode || e.charCode;
        if (0 === code || 229 === code) {
            var text = this.getViewValue();
            code = text.substr(text.length - 1).charCodeAt(0);
        }
        return code;
    };
    ;
    TextFormatter.prototype.isKeyCodeArrow = function (keyCode) {
        return keyCode === KeyCode.LEFT_ARROW || keyCode === KeyCode.RIGHT_ARROW;
    };
    ;
    TextFormatter.prototype.setViewValue = function (text) {
        this.elem.value = text;
    };
    ;
    TextFormatter.prototype.setCursorPos = function (pos) {
        var element = this.elem;
        if (element.selectionStart === element.selectionEnd) {
            element.selectionStart = pos;
            element.selectionEnd = pos;
        }
        else {
            element.selectionStart = pos;
        }
    };
    ;
    TextFormatter.prototype.getCursorPos = function () {
        return this.elem.selectionStart;
    };
    ;
    TextFormatter.prototype.getViewValue = function () {
        return this.elem.value;
    };
    ;
    TextFormatter.prototype.getModelValue = function (text) {
        if (!text) {
            text = this.elem.value || "";
        }
        return text.replace(this.separatorPattern, "");
    };
    ;
    TextFormatter.prototype.setModelValue = function (value) {
        this.elem.value = value;
        this.format();
    };
    ;
    TextFormatter.prototype.setPattern = function (pattern) {
        this.pattern = pattern;
        this.expectedLength = pattern.replace(/[\{\}]/g, "").length;
        this.separatorPattern = this.buildSeparatorPattern(pattern);
        this.format();
    };
    ;
    TextFormatter.prototype.format = function () {
        var formattedString = this.formatString(this.getModelValue());
        this.setViewValue(formattedString);
    };
    ;
    TextFormatter.prototype.getChar = function (e) {
        return e >= 96 && e <= 105 ? (e - 96).toString() : String.fromCharCode(e);
    };
    ;
    TextFormatter.prototype.formatString = function (rawText) {
        var formattedChars = [];
        var rawTextChars = rawText.split("");
        var patternChars = this.pattern.split("");
        while (patternChars.length > 0 && rawTextChars.length > 0) {
            var patternChar = patternChars.shift();
            if ("{" !== patternChar && "}" !== patternChar) {
                if (this.isSeparator(patternChar)) {
                    formattedChars.push(patternChar);
                }
                else {
                    formattedChars.push(rawTextChars.shift());
                }
            }
        }
        return formattedChars.join("");
    };
    ;
    return TextFormatter;
}());
exports.TextFormatter = TextFormatter;
