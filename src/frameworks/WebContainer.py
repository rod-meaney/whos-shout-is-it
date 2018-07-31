'''
Created on 13/10/2011

@author: rodm
'''
import webapp2
from datetime import datetime
from google.appengine.api import users
from frameworks.wrapper import menu
import logging

class StandardPage(webapp2.RequestHandler): 
    def __init__(self, request, response):
        self.initialize(request, response)
        if users.get_current_user():
            uname = users.get_current_user().email()
        else:
            uname = "anonymous"
        self.template_values = {"menu":menu(), "username":uname, "logout":users.create_logout_url("/abdc?random="+datetime.now().strftime("%Y%m%d%H%M%S"))}
        
        
        
    