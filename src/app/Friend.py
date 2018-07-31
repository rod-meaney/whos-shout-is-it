'''
Created on Jan 16, 2014

@author: roderickmeaney
'''

from google.appengine.ext import db
from google.appengine.api import users
#from app.Person import Person
from admin.utils import KnownError
from admin import df
from admin.MailTemplate import sendTemplateEmail
import logging

'''
A friend has a key (the record key) which uniquely identifies it
Whether a friend is shared or not this is the same.

Friend requests are just someone elses friend record with your email address as the friend_id
It stops being a request when friend_id is set to 
    blank             - friend request rejected by other user or cancelled by you
    friends google_id - friend request accepted and friend record created for current user  
'''
class Friend(df.DomainFramework):
    #security - the id of the person that can view the record
    google_id = db.StringProperty()
    #email or google id of accepted friend, blank if local friend
    friend_id = db.StringProperty()
    friend_name = db.StringProperty() 
    
    is_deleted = db.BooleanProperty() #whether the friend has been deleted
    delete_date = db.DateTimeProperty() #Date the friend was deleted
    
    #Just while it is a request
    is_request = db.BooleanProperty()
    request_from_name = db.StringProperty()
    request_from_email = db.StringProperty()
    request_to_email = db.StringProperty() #mostly for duplicate checking
    
    def __init__(self, *args, **kwargs):  
        super(Friend, self).__init__(*args, **kwargs)
        if self.google_id == None:
            self.google_id=users.get_current_user().user_id()

    def migrate(self):
        logging.info("Starting migration")
        query=self.all()
        for shout in query.run():
            shout.is_deleted = False
            shout.put()
            logging.info("migrated:"+str(shout.key()))

    def create(self, _friend_name, _friend_id, _from_name):
        _friend_id = _friend_id.lower()
        self.doesFriendExist(_friend_name, _friend_id)
        self.is_request = False
        self.is_deleted = False
        self.request_to_email=''
        self.friend_id = _friend_id
        self.friend_name = _friend_name 
        if '@' in _friend_id: 
            self.is_request = True
            self.request_from_email=users.get_current_user().email().lower()
            self.request_from_name = _from_name
            self.request_to_email = _friend_id
        self.createNew()
        if '@' in _friend_id: 
            sendTemplateEmail(_friend_id, "SendRequest", [self], True, None, None)
        return {"add_person":{"id":str(self.key()), "name":self.friend_name, "local":True}}
    
    def connectedFriend(self, _google_id):
        '''
        Based on the friends id (either google, email or blank)
        return the current users friend document for the connected friend
        Returns None if they are not connected friends
        '''
        if '@' in self.friend_id: return None
        if self.friend_id =='': return None
        q1=self.all()
        q1.filter("google_id = ", _google_id)
        q1.filter("friend_id = ", users.get_current_user().user_id())
        for friend in q1.run():
            #should only be one
            try :
                if friend.is_deleted:
                    return None
            except :
                logging.info("Checking on a friend created before delete flag available so ignoring..")
            return friend
        return None
    
    def createFromRequest(self, _friend_request):
        self.friend_id = _friend_request.google_id
        self.friend_name = _friend_request.request_from_name
        self.request_to_email = _friend_request.request_from_email
        self.is_deleted = False
        self.is_request = False
        self.createNew()
        return {"add_person":{"id":str(self.key()), "name":self.friend_name, "local":False}}    
                                
    def getFriend(self,_key,_error):
        friend = Friend().get(_key)
        if friend == None:
            raise KnownError(["Friend does not exist"])
        if not(friend.google_id == users.get_current_user().user_id()):
            raise KnownError([_error])
        return friend

    def cancelFriendRequest(self, _key):
        #Check that it is MY friend request before removing
        friend = self.getFriend(_key, 'Not a valid friend to cancel.')
        self.clearFriendRequest(friend)
        friend.update()
        return {}

    def acceptFriendRequest(self, _key):
        #Check that it is a friend request FOR ME before accepting
        friend = Friend().get(_key)
        if not(friend.friend_id == users.get_current_user().email().lower()):
            raise KnownError(['Not a valid friend request to accept.'])
        response = self.createFromRequest(friend)
        friend.is_request = False
        friend.friend_id = users.get_current_user().user_id()
        friend.update()
        return response 

    def rejectFriendRequest(self, _key):
        #Check that it is a friend request FOR ME before removing
        friend = Friend().get(_key)
        if not(friend.friend_id == users.get_current_user().email().lower()):
            raise KnownError(['Not a valid friend request to cancel.'])
        self.clearFriendRequest(friend)
        friend.update()
        return {}
            
    def clearFriendRequest(self, _friend):
        _friend.friend_id=''
        _friend.is_request = False
        _friend.request_from_name = ''
        _friend.request_from_email = ''
        _friend.request_to_email = ''
 
    def allFriendsDict(self):
        results = []
        q1=self.all()
        q1.filter("google_id = ", users.get_current_user().user_id())
        q1.filter("is_deleted = ", False)
        q1.order("friend_name")
        for friend in q1.run():
            local = True
            if (friend.request_to_email=='') or (friend.is_request==True) :local = False 
            results.append([friend.friend_name, str(friend.key()), local])
        return results
            
    def doesFriendExist(self, _friend_name, _friend_id):
        '''
        If they use an e-mail, then check for e-mail
        Otherwise just check name
        '''
        if not(_friend_id ==''):
            #someone already a friend
            q2=self.all()
            q2.filter("google_id = ", users.get_current_user().user_id())
            q2.filter("request_to_email = ", _friend_id.lower())
            for friend in q2.run(limit=1):
                if friend.is_deleted:
                    friend.friend_name = _friend_name
                    friend.is_deleted = False
                    friend.put()
                    raise KnownError(["Your deleted friend has been re-activated. No previous shouts are available for viewing.  Refresh browser immediately!"])
                else:
                    raise KnownError(["You already have a friend (or sent request) for this name (%s) and email (%s)." % (friend.friend_name, friend.request_to_email)])
            #a friend request from the same person
            q3=self.all()
            q3.filter("friend_id = ", users.get_current_user().email().lower())
            q3.filter("request_from_email = ", _friend_id.lower())
            for friend in q3.run(limit=1):
                raise KnownError(["You have a friend request for this name (%s) and email (%s)." % (friend.request_from_name, friend.request_from_email)])
                q1=self.all()
        else:
            #No email address, so check name
            q1=self.all()
            q1.filter("google_id = ", users.get_current_user().user_id())
            q1.filter("friend_name = ", _friend_name)
            for friend in q1.run(limit=1):
                #someone of the same name
                if friend.is_deleted: 
                    if friend.friend_id=='':
                        logging.info("Create a new blank friend - who cares")
                    else:
                        raise KnownError(["You have a deleted friend by this name (%s), with email %s. Either rename or re-activate friend using email as well." % (friend.friend_name, friend.request_to_email)])
                else:
                    raise KnownError(["You already have a friend by this name (%s)" % _friend_name])
            
    def checkErrorBeforeRaising(self, _error, _friend):
        if _friend.is_deleted:
            _friend.is_deleted=False
            _friend.put()
        else:
            raise KnownError([_error])
    
    def sentRequests(self):
        '''
        People who I want to be friends with
        '''
        query=self.all()
        query.filter("google_id = ", users.get_current_user().user_id())
        query.filter("is_request = ", True)
        query.filter("is_deleted = ", False)
        query.order("friend_name")
        list=[]
        for request in query.run():
            list.append({"key":str(request.key()), 
                         "name":request.friend_name, 
                         "email":request.friend_id})
        return list       
        
    def friendRequests(self):
        '''
        People who want to be friend with me
        '''
        query=self.all()
        query.filter("friend_id = ", users.get_current_user().email().lower())
        query.filter("is_deleted = ", False)
        query.order("request_from_name")
        list=[]
        for request in query.run():
            list.append({"key":str(request.key()), 
                         "from_name":request.request_from_name, 
                         "email_from":request.request_from_email})
        return list
    
    def friendRequestsCount(self):
        '''
        People who want to be friend with me
        '''
        query=self.all()
        query.filter("friend_id = ", users.get_current_user().email().lower())
        query.filter("is_deleted = ", False)
        return {"ReceivedFriendRequestsCount":len(query.fetch(1000))}    