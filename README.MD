## How to run demo
- install typescript 
- tsc --build
- open test.html in browser
## How to use formatter
```javascript
var elem = document.querySelector("input");
var formatter = new TextFormatter(elem, "{{000}}#{{0000}}-{{00}}", /a-zA-Z0-9/)
```
If input `123456789`, it will be formatted to `123#4567-89`
## API
```typescript
class TextFormatter(element:HTMLInputElement, pattern:string, contentReg:RegExp)
```
- `element`: the input DOM control
- `pattern`: the final format with placeholders. e.g. `{{000}}#{{0000}}-{{00}}`
- `contentReg`: the texts to replace placeholders in `pattern`, default is `/\d/` which means it only
accepts numbers.

