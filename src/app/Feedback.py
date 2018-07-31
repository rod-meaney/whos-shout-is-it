'''
Created on Apr 21, 2011

@author: rod
'''
from google.appengine.ext import db
from google.appengine.api import users
import admin.df
from admin.MailTemplate import sendTemplateEmail

class Feedback(admin.df.DomainFramework):
    '''
    Feedback
    '''
    feedback_in = db.StringProperty(multiline=True)
    feedback_google_id = db.StringProperty()
    status = db.StringProperty()
    result = db.StringProperty()

    def __init__(self, *args, **kwargs):  
        super(Feedback, self).__init__(*args, **kwargs) 
            
    def create(self, feedback_in):
        '''
        Creates a basic feedback
        '''
        self.feedback_in = feedback_in
        self.feedback_google_id = users.get_current_user().user_id()
        self.createNew()
        sendTemplateEmail("", "FeedbackReceived", [self], True, None, None)