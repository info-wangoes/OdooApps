odoo.define('color_picker_widget.color_picks', function(require){
    var basic_fields = require('web.basic_fields');
    var registry = require('web.field_registry');
    var colorWidget = require('color_picker_widget.colorPicker_widget');
    var Widget = require('web.Widget');
    
    var color_widget = basic_fields.FieldChar.extend({
        init: function(parent, name, record, options){
            this._super.apply(this, arguments);
        },
        start: function(){
            var self = this;
            return this._super.apply(this, arguments).then(function () {
                self.t = setInterval(function () {
                        self.on_ready();
                }, 700);
            });
        },

        _renderReadonly: function () {
            var show_value = this._formatValue(this.value);
            this.$el.text(show_value);
            this.$el.css("background-color", show_value);
        },
        
        on_ready: function(){
            var self = this;
            if(self.t){
                clearInterval(self.t);
            }
            if (!self.$input) {
                return;
            }
            var colorPicker_widget = new colorWidget(self);
            
            colorPicker_widget.insertAfter(self.$input);
            self.$input[0].style.background = self.$input[0].value
            self.$input[0].style.width = '80%'
        },

        update_color : function (color) {
            var self = this;
            if (self.$input) {
                self.$input.val(color);
                self.$input[0].style.background = color
                self._doAction();
            }
        }

    });

    registry.add('color_widget', color_widget);
});