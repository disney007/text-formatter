enum KeyCode {
    BACK_SPACE = 8,
    DELETE = 46,
    LEFT_ARROW = 37,
    RIGHT_ARROW = 39
}

export class TextFormatter {
    expectedLength = 0;

    pattern: string = '';
    separatorPattern!: RegExp;

    constructor(private elem: HTMLInputElement, pattern: string, private contentPattern = /\d/) {
        this.setPattern(pattern);
        elem.addEventListener('keydown', (e) => {
            const keycode = this.getKeyCode(e);
            const char = this.getChar(keycode);
            const cursorPos = this.getCursorPos();
            const viewValue = this.getViewValue();
            let nextCursorPos = this.calcCursorForDeletion(keycode, cursorPos, viewValue);

            if (this.isKeyCodeArrow(keycode) && !e.ctrlKey && !e.shiftKey) {
                nextCursorPos = this.calcCursorForMovement(keycode, cursorPos, viewValue)
            }

            if (nextCursorPos !== cursorPos) {
                this.setCursorPos(nextCursorPos)
            }

            const currentLength = viewValue.length;
            if (this.expectedLength <= currentLength && this.contentPattern.test(char) && cursorPos === currentLength) {
                e.preventDefault();
            }
        });

        elem.addEventListener("keypress", (e) => {
            const char = String.fromCharCode(e.which | e.keyCode | e.charCode);
            if (!this.contentPattern.test(char)) {
                e.preventDefault()
            }
        });

        elem.addEventListener("paste", () => {
            setTimeout(() => this.update());
        });

        elem.addEventListener("keyup", (e) => {
            const keycode = this.getKeyCode(e);
            const char = this.getChar(keycode);
            if (this.contentPattern.test(char) || keycode === KeyCode.BACK_SPACE || keycode === KeyCode.DELETE) {
                this.update();
            }
        })
    }

    update() {
        const currentCursorPos = this.getCursorPos();
        const modelValue = this.getModelValue(this.getViewValue().substr(0, currentCursorPos));
        this.format();
        const cursorPos = this.formatString(modelValue);
        this.setCursorPos(cursorPos.length)
    }

    calcCursorForDeletion(keycode: KeyCode, currentCursorPos: number, text: string): number {
        if (keycode === KeyCode.BACK_SPACE && currentCursorPos > 0) {
            if (this.isSeparator(text[currentCursorPos - 1])) {
                return currentCursorPos - 1
            }
        } else if (keycode === KeyCode.DELETE && currentCursorPos < text.length) {
            if (this.isSeparator(text[currentCursorPos])) {
                return currentCursorPos + 1
            }
        }
        return currentCursorPos
    };

    calcCursorForMovement(keycode: KeyCode, currentCursorPos: number, text: string): number {
        if (keycode === KeyCode.RIGHT_ARROW) {
            if (this.isSeparator(text[currentCursorPos])) {
                return currentCursorPos + 1
            }
        } else if (currentCursorPos >= 2 && this.isSeparator(text[currentCursorPos - 2])) {
            return currentCursorPos - 1;
        }

        return currentCursorPos;
    };

    isSeparator(value: string): boolean {
        this.separatorPattern.lastIndex = 0;
        return this.separatorPattern.test(value)
    };

    buildSeparatorPattern(pattern: string): RegExp {
        const finalText = pattern
            .replace(/{{.*?}}/g, "")
            .split("")
            .reduce((result, current) => {
                if (result.indexOf(current) === -1) {
                    if ("-" === current) {
                        current = "\\" + current
                    }
                    result += current;
                }
                return result;
            }, "");
        return new RegExp("[" + finalText + "]", "g");
    };

    getKeyCode(e: KeyboardEvent): number {
        let code = e.keyCode || e.charCode;
        if (0 === code || 229 === code) {
            const text = this.getViewValue();
            code = text.substr(text.length - 1).charCodeAt(0)
        }
        return code
    };

    isKeyCodeArrow(keyCode: KeyCode): boolean {
        return keyCode === KeyCode.LEFT_ARROW || keyCode === KeyCode.RIGHT_ARROW
    };

    setViewValue(text: string) {
        this.elem.value = text;
    };

    setCursorPos(pos: number) {
        const element = this.elem;
        if (element.selectionStart === element.selectionEnd) {
            element.selectionStart = pos;
            element.selectionEnd = pos;
        } else {
            element.selectionStart = pos;
        }
    };

    getCursorPos(): number {
        return <number>this.elem.selectionStart
    };

    getViewValue(): string {
        return this.elem.value;
    };

    getModelValue(text?: string): string {
        if (!text) {
            text = this.elem.value || "";
        }
        return text.replace(this.separatorPattern, "");
    };

    setModelValue(value: string) {
        this.elem.value = value;
        this.format();
    };

    setPattern(pattern: string) {
        this.pattern = pattern;
        this.expectedLength = pattern.replace(/[\{\}]/g, "").length;
        this.separatorPattern = this.buildSeparatorPattern(pattern);
        this.format();
    };

    format() {
        const formattedString = this.formatString(this.getModelValue());
        this.setViewValue(formattedString)
    };

    getChar(e: KeyCode): string {
        return e >= 96 && e <= 105 ? (e - 96).toString() : String.fromCharCode(e)
    };


    formatString(rawText: string): string {
        const formattedChars = [];
        const rawTextChars: string[] = rawText.split("");
        const patternChars: string[] = this.pattern.split("");

        while (patternChars.length > 0 && rawTextChars.length > 0) {
            let patternChar = <string>patternChars.shift();
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

}
