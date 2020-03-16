# -*- coding: utf-8 -*-
from odoo import http
import werkzeug
import werkzeug.utils
import werkzeug.wrappers
import werkzeug.wsgi
from odoo.http import request
from odoo.addons.web.controllers.main import Home


class CostomerOrderPos(http.Controller):
    @http.route('/pos', auth='public')
    def index(self, **kw):
        return werkzeug.utils.redirect('/web/login?is_pos=true')

class Home(Home):
    @http.route('/web/login', type='http', auth="none", sitemap=False)
    def web_login(self, redirect=None, **kw):
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
        action = request.env.ref('customer_order_view.order_history_view_action').id
        menu = request.env.ref('customer_order_view.order_history').id
        link = base_url + '/web#view_type=order_history_view&model=order.history.view&menu_id='+str(menu)+'&action='+str(action)+''
        res = super(Home, self).web_login()
        if 'is_pos' in kw:
            if kw['is_pos'] == 'true':
                return werkzeug.utils.redirect(link)
        else:
            return res

