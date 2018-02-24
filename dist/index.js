import { $, on } from './helpers.js';
on(document, 'DOMContentLoaded', function (e) {
    on($('#filepicker'), 'change', function (e) {
        console.log(this.files);
    });
});
//# sourceMappingURL=index.js.map