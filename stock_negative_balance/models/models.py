# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError

class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    @api.model
    def create(self,values):
        """Check Stock Negetive Quantity On Sale"""
        if 'product_id' in values and 'product_uom_qty' in values:
            product_obj = self.env['product.product'].browse(values['product_id'])
            qty_diff = int(product_obj.qty_available) - values['product_uom_qty']
            if values['product_uom_qty'] > int(product_obj.qty_available):
                raise ValidationError((
                    "You cannot create sales/quotation because the "
                    "stock level of the product ' %s ' is ' %s ' would become negative"
                    " on the stock and negative stock is not allowed for this product") % (
                        product_obj.name, qty_diff))
        return super(SaleOrderLine,self).create(values)

    @api.multi
    def write(self, values):
        """Check Stock Negetive Quantity On Sale"""
        if 'product_uom_qty' in values:
            qty_diff = int(self.product_id.qty_available) - values['product_uom_qty']
            if values['product_uom_qty'] > int(self.product_id.qty_available) :
                raise ValidationError((
                    "You cannot edit sale order quotation because the "
                    "stock level of the product ' %s ' and ' %s ' would become negative"
                    " on the stock and negative stock is not allowed for this product") % (
                        self.product_id.name, qty_diff))
        return super(SaleOrderLine,self).write(values)


class StockMove(models.Model):
    _inherit = 'stock.move'

    @api.model_create_multi
    def create(self, vals_list):
        """Check Stock Negetive Quantity On Sale Inventory"""
        if 'move_line_ids' in vals_list[0]:
            return super(StockMove,self).create(vals_list)
        for values in vals_list:
            if 'product_uom_qty' in values and 'product_id' in values:
                product_obj = self.env['product.product'].browse([values['product_id']])
                qty_diff = int(product_obj.qty_available) - values['product_uom_qty']
                if values['product_uom_qty'] > int(product_obj.qty_available) :
                    raise ValidationError((
                        "You cannot create delivery order because the "
                        "stock level of the product ' %s ' and ' %s ' would become negative"
                        " on the stock and negative stock is not allowed for this " 
                        "product and/or location.") % (
                            product_obj.name, qty_diff))
        return super(StockMove,self).create(vals_list)

    def write(self, vals):
        """Check Stock Negetive Quantity On Sale Inventory"""
        if 'product_uom_qty' in vals:
            qty_diff = int(self.product_id.qty_available) - vals['product_uom_qty']
            if vals['product_uom_qty'] > int(self.product_id.qty_available) :
                raise ValidationError((
                    "You cannot edit delivery order because the "
                    "stock level of the product ' %s ' is ' %s ' would become negative"
                    " on the stock and negative stock is not allowed for this " 
                    "product and/or location.") % (
                        self.product_id.name, qty_diff))
        return super(StockMove,self).write(vals)