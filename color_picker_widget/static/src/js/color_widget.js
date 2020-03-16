odoo.define('color_picker_widget.colorPicker_widget', function (require) {
    var Widget = require('web.Widget');
    var rpc = require('web.rpc');
    var id = []
    var colorWidget = Widget.extend({
        template: 'ColorTemplate',
        init: function (parent) {
            this.parent = parent || {};
            this._super(parent);
        },
        start: function () {
            var self = this;
            self.on_ready();
            return this._super.apply(this, arguments).then(function () {
                self.on_ready();
            });
        },
        on_ready: function () {
            var self = this;
            if(!this.$el){
                return;
            }
            $(self.$el.filter('.color-toggle')[0]).unbind("click").click(function () {
                $(self.$el.filter('#color-container')[0]).toggle();
            });

            $(".box").click(function(event){
                var color = $(this).text().trim()
                self.parent.update_color(color);
            });
        },
    });

    return colorWidget;
});
