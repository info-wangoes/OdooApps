# -*- coding: utf-8 -*-
{
    'name': "Customer POS View",

    'summary': """
        New view to check order history of customer""",

    'description': """
        New view to check order history of customer with multiple functionality
        like filter product and searching the product and add product to the
        shopping card and can edit or remove after add product to the card.  
    """,

    'author': "Wangoes Technology/Balram",
    'website': "https://wangoes.com/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/11.0/odoo/addons/base/module/module_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base','product','sale','sale_management', 'sales_team', 'website_sale', 'stock'],

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