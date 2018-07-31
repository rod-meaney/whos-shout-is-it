'''
Created on Jan 16, 2014

@author: roderickmeaney
'''

from google.appengine.ext import db
from google.appengine.api import users
from admin import df
from app.ShoutHelper import ShoutList
from datetime import datetime, timedelta
import logging
from admin.utils import KnownError

class Shout(df.DomainFramework):
    '''
    If adding any extra attributes, add them to ShoutArchive
    '''
    google_id = db.StringProperty() #id of the person who can view the item
    item = db.StringProperty() #item name
    date = db.DateTimeProperty() #date and time the item was IOU'd
    name_id = db.StringProperty() #key of the person (friend I think - check) record this shout is with 
    my_shout = db.IntegerProperty() #+1 for my shout, -1 for their shout
    location = db.GeoPtProperty()
    is_deleted = db.BooleanProperty() #whether the shout has been deleted
    delete_date = db.DateTimeProperty() #Date the shout was deleted
    
    def __init__(self, *args, **kwargs):  
        super(Shout, self).__init__(*args, **kwargs)
        
    def create(self, _item, _date_str, _my_shout, _friend, _last_updated_str, _latt_str, _long_str):
        '''
        Creates a basic item and returns the time it was created
        '''
        response = {}
        self.google_id=_friend.google_id
        self.name_id = str(_friend.key())
        self.item=_item
        self.date = datetime.strptime(_date_str, "%Y-%m-%d %H:%M")
        self.my_shout = _my_shout
        self.is_deleted = False
        if not(_latt_str==''):
            self.location="%s,%s" %  (_latt_str, _long_str)
        self.createNew()
        response.update({"updates":{"shouts_last_updated":{"dt":self.created.strftime("%Y-%m-%d %H:%M:%S")}}})
        response.update({"created_time":self.created}) #for passing extra data back - lazy :-)
        return response

    def historyJson(self, _key, _item):
        result = {"history":[]}
        shouts=self.history(_key, _item)
        for shout in shouts:
            result['history'].append(shout.toDict())
        return result
    
    def toDict(self):
        sign = "-"
        if self.my_shout == 1:sign = "+"
        loc = self.location 
        if self.location==None: loc=''
        return {"shout":{"key":str(self.key()),
                       "my_shout":self.my_shout,
                       "sign":sign,
                       "gl":str(loc),  
                       "date":self.date.strftime("%Y-%m-%d %H:%M")}}

    def history(self, _key, _item):
        query=self.all()
        query.filter("google_id = ", users.get_current_user().user_id())
        query.filter("item = ", _item)
        query.filter("name_id = ", _key)
        query.filter("is_deleted = ", False)
        query.order("-date")
        query.order("-created")
        return query.fetch(1000)
 
    def deltaHistoryAsQueue(self, _last_updated_str):
        '''
        If they have not started synching - i.e. a new client, then send it all
        
        '''
        if _last_updated_str=='': return self.fullHistoryAsUpdates() #shout creation implies this has already been done
        response = []
        #DateTime from last updated
        dt = datetime.strptime(_last_updated_str, "%Y-%m-%d %H:%M:%S")
        dt = dt + timedelta(seconds = 1)
        
        #All adds since last date
        query=self.all()
        query.filter("google_id = ", users.get_current_user().user_id())
        query.filter("created > ", dt)
        for shout in query.run():
            shout_string = 'me'
            if shout.my_shout == -1: shout_string = 'you' 
            response.append({"key":shout.name_id, "item":shout.item, "shout":shout_string, "type":"add"})
            
        #all subtracts since last date
        q2=self.all()
        q2.filter("google_id = ", users.get_current_user().user_id())
        q2.filter("is_deleted = ", True)
        q2.filter("delete_date > ", dt)
        for shout in q2.run():
            shout_string = 'me'
            if shout.my_shout == -1: shout_string = 'you' 
            response.append({"key":shout.name_id, "item":shout.item, "shout":shout_string, "type":"subtract"})        

        return {"shouts":response}

    def fullHistoryAsUpdates(self):
        response = {"updates":{}}
        shout_list = ShoutList()
        q1=self.all()
        q1.filter("google_id = ", users.get_current_user().user_id())
        q1.filter("is_deleted = ", False)
        for shout in q1.run():
            shout_list.addShout(shout.name_id, shout.item, shout.my_shout)
        response["updates"] = shout_list.toDict()
        return response
    
    def deleteAllFriendShouts(self, _friend_key):
        query=self.all()
        #the google ID protects deleting by unauthorised users
        query.filter("google_id = ", users.get_current_user().user_id())
        query.filter("name_id = ", _friend_key)
        for shout in query.run():
            shout.is_deleted = True
            shout.delete_date = datetime.utcnow()
            shout.update()
    
    def getShout(self,_key):
        shout = Shout().get(_key)
        if shout == None:
            raise KnownError(["Shout does not exist"])        
        if not(shout.google_id == users.get_current_user().user_id()):
            raise KnownError(["You are accessing a shout you do not have access to."])
        return shout    