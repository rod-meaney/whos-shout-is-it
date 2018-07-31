'''
Created on May 30, 2011

@author: rod
'''
from google.appengine.ext import db
from datetime import datetime
import logging
class DomainFramework(db.Model):
    
    created = db.DateTimeProperty()
    updated = db.DateTimeProperty()
    
    def blank(self):
        for property in self.properties():
            try:
                self.__setattr__(property, "")
            except:
                logging.error("Need to fix framework for:%s", property)   
            
    def createNew(self):
        self.created = datetime.utcnow()
        self.updated = datetime.utcnow()
        self.put()
            
    def update(self):
        self.updated = datetime.utcnow()
        self.put()   
        
    def updateFieldsFromPost(self, request):
        multivalues={}
        for key, value in request.POST.iteritems():
            #logging.info("Saving key:%s for value:%s" % (key,value))
            if ("[" in key):
                kv = key.split("[")[0]
                if (multivalues.has_key(kv)):
                    multivalues[kv].append(value)
                else:
                    multivalues[kv]=[value]
            else:
                if key!="key":
                    self.__setattr__(key,value)
        for key, value in multivalues.iteritems():
            self.__setattr__(key,value)