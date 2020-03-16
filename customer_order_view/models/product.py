from odoo import models, fields, api
from lxml import etree
from odoo.osv.orm import setup_modifiers

class Product(models.Model):
    _inherit = 'product.template'
    is_arrival = fields.Boolean()
    product_number = fields.Char(string="Packing Order")

class SaleOrder(models.Model):
    _inherit = 'sale.order.line'
    _order = 'editor_rys3 asc'

    editor_rys3 = fields.Char('Packing Order',compute="get_product_number", 
                                        store=True)

    @api.depends('product_id')
    def get_product_number(self):
        for record in self:
            record.editor_rys3 = record.product_id.product_number


class SaleOrder(models.Model):
    _inherit = 'sale.order'
   
    # this method will make from readonly on click on button check details button
    @api.model
    def fields_view_get(self, view_id=None, view_type=False, toolbar=False, submenu=False):
        context = self._context
        res = super(SaleOrder, self).fields_view_get(view_id=view_id, view_type=view_type, toolbar=toolbar,
                                                    submenu=submenu)
        if context.get('turn_view_readonly'): 
            doc = etree.XML(res['arch'])
            if view_type == 'form':            
                for node in doc.xpath("//field"): 
                    node.set('readonly', '1')
                    setup_modifiers(node, res['fields']['payment_term_id'])
                res['arch'] = etree.tostring(doc)
        return res

    # this method will open sale order form
    @api.multi
    def check_order_details(self):
        form_view_id = self.env.ref('sale.view_order_form').id
        view = {
            'name':'Sale Order',
            'type':'ir.actions.act_window',
            'res_model':'sale.order',
            'view_mode':'form',
            'views':[(form_view_id,'form')],
            'target' : 'new',
            'res_id':self.id,
        }
        return view
