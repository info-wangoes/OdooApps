# -*- coding: utf-8 -*-
{
    'name': "Odoo Auth2",

    'summary': """
       Allow users to sign up through OAuth2 Provider """,

    'description': """
        Allow users to sign up through OAuth2 Provider.It will authenticate the users token.

    """,

    'author': "Balram",
    'website': "https://wangoes.com/",
    'category': 'Uncategorized',
    'version': '0.1',
    'images': ['static/description/banner.png'],

    # any module necessary for this one to work correctly
    'depends': ['base','hr'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'views/auth_user_inherit.xml',
        'data/data.xml',
    ],
    
   
}