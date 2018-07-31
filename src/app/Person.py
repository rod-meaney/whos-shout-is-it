'''
Created on Jan 16, 2014

@author: roderickmeaney
'''

from google.appengine.ext import db
from google.appengine.api import users
from admin.utils import KnownError
from admin import df
from app.Friend import Friend
from app.Shout import Shout
from datetime import datetime
import logging

class Person(df.DomainFramework):
    google_id = db.StringProperty()
    people_updated = db.DateTimeProperty()
    shouts_updated = db.DateTimeProperty()
    name = db.StringProperty()
    send_data = bool
    
    def __init__(self, *args, **kwargs):  
        super(Person, self).__init__(*args, **kwargs)
        if self.google_id == None:
            self.google_id=users.get_current_user().user_id()

    def loadCheck(self, _last_updated_str):
        person = self.getPerson()
        response = {"me":{}, "friends":{}}
        response["me"]["name"]='' 
        response["friends"] = Friend().allFriendsDict()
        if person.name <> None:
            # Always send their latest name just in case
            response["me"]["name"] = person.name
        response.update(Shout().deltaHistoryAsQueue(_last_updated_str))
        #pass back any current friend requests 
        friends = Friend().friendRequests()
        if len(friends)>0:
            response["ReceivedFriendRequests"] = friends
        return response        
    
    def addFriend(self, _friend_name, _friend_id):
        return Friend().create(_friend_name, _friend_id, (self.getPerson()).name)
    
    def updateFriendName(self, _name, _key):
        friend = Friend().getFriend(_key, "Not a friend")
        friend.friend_name = _name
        friend.update();
        return {}

    def addShout(self, _item, _date_str, _key, _my_shout, _last_updated_str, _latt_str, _long_str):
        '''
        1. Get Friend record - if does not exist or is not valid, reject
        2. Get connected friends, friend record for me
        2a.  If we are connected, create shout for friend
        2c. Update their person record
        3 create shout record for me
        4 Update my person record
        '''
        my_friend = Friend().getFriend(_key, 'not a valid friend')
        connection_friend = my_friend.connectedFriend(my_friend.friend_id)
        if not(connection_friend == None):
            #Create connected shout and update connected person with latest update time
            connection_person = Person(google_id=connection_friend.google_id).getPerson()
            connection_shout = Shout().create(_item, _date_str, -int(_my_shout), connection_friend, None,'','')
            connection_person.updateLatestShoutDT(connection_shout['created_time'])
        response = Shout().create(_item, _date_str, int(_my_shout), my_friend, _last_updated_str,  _latt_str, _long_str)
        self.getPerson().updateLatestShoutDT(response['created_time'])
        response.pop("created_time")
        return response

    def deleteFriend(self, _friend_id):
        #Mark as deleted all their shouts
        Shout().deleteAllFriendShouts(_friend_id)
        #Mark as deleted all their friend record
        my_friend = Friend().getFriend(_friend_id, 'not a valid friend')
        my_friend.is_deleted=True
        my_friend.delete_date = datetime.utcnow()
        my_friend.update()
        return {"deleted":_friend_id}

    def deleteShout(self, _key):
        shout = Shout().getShout(_key)
        shout.is_deleted = True
        shout.delete_date = datetime.utcnow()
        shout.update()
        self.getPerson().updateLatestShoutDT(shout.delete_date)
        return {"updates":{"shouts_last_updated":{"dt":shout.delete_date.strftime("%Y-%m-%d %H:%M:%S")}}}

    def fullSynch(self):
        '''
        Pulls down all existing shout data for user
        NB - Iou.fullHistory returns {"updates":{}} at the minimum
        '''
        return Shout().fullHistoryAsUpdates()

    def updateLatestShoutDT(self, _date_time):
        self.shouts_updated = _date_time
        self.save()

    def shoutHistory(self, _key, _item):
        return Shout().historyJson(_key, _item)

    def updatePerson(self, _post):
        person = self.getPerson()
        person.updateFieldsFromPost(_post)
        person.save()
        response = {} 
        return response
            
    def getPerson(self):
        query=self.all()
        query.filter("google_id = ", self.google_id)
        result=query.fetch(10)
        if len(result)>1:
            raise KnownError(["User %s has multiple entries..." % users.get_current_user().email()])
        elif len(result)==1:
            person = result[0]
        else:
            person = Person(google_id = self.google_id)
            person.createNew()
        return person