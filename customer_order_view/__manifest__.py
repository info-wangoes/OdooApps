# -*- coding: utf-8 -*-
{
    'name': "POS View of Sale Order",

    'summary': """
        New view to create Sale Order from Custom POS view and check order history of customer""",

    'description': """
        New view to create Sale Order from Custom POS view and check order history of customer with multiple functionality
        like filter product and searching the product and add product to the
        shopping card and can edit or remove after add product to the card.  
    """,

    'author': "Wangoes Technology",
    'website': "https://wangoes.com/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/11.0/odoo/addons/base/module/module_data.xml
    # for the full list
    'category': 'Sales',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base','product','sale','sale_management', 'sales_team', 'website_sale', 'stock'],

    'images': ['static/description/banner.png'],

    'price': 400,
    'currency': 'EUR',
    'license': 'OPL-1',
    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/views.xml',
    ],
    'qweb' : [
        'static/src/xml/header_template.xml',
        'static/src/xml/order_history.xml',
    ],
}