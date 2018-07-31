import logging
import webapp2
from app.Feedback import Feedback
from google.appengine.ext.webapp import template
from frameworks.WebContainer import StandardPage
from frameworks.wrapper import url_inject
from app.Person import Person
from app.Friend import Friend
import json
import time
from admin.utils import KnownError

class AddFeedback(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        feedback_in=self.request.POST['feedback_in'].strip()
        Feedback().create(feedback_in)
        self.response.out.write(json.dumps({"response":{"updates":{}}}))

class UpdatePerson(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().updatePerson(self.request)
        self.response.out.write(json.dumps({"response":response}))

class AddFriend(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().addFriend(self.request.POST['friend_name'].strip(),
                                   self.request.POST['friend_id'].strip())
        self.response.out.write(json.dumps({"response":response}))

class DeleteFriend(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().deleteFriend(self.request.POST['key'].strip())
        self.response.out.write(json.dumps({"response":response}))

class EditFriend(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().updateFriendName(self.request.POST['friend_name'].strip(),
                                   self.request.POST['key'].strip())
        self.response.out.write(json.dumps({"response":response}))
        
class Check(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().loadCheck(self.request.POST['shouts_last_updated'].strip())
        self.response.out.write(json.dumps({"response":response}))
        
class FriendRequests(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = {"response":{}}
        response["response"]["SentFriendRequests"] = Friend().sentRequests()
        response["response"]["ReceivedFriendRequests"] = Friend().friendRequests()
        self.response.out.write(json.dumps(response))  
              
class AcceptFriendRequests(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Friend().acceptFriendRequest(self.request.POST['key'].strip())
        self.response.out.write(json.dumps({"response":response}))
      
class RejectFriendRequests(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Friend().rejectFriendRequest(self.request.POST['key'].strip())
        self.response.out.write(json.dumps({"response":response}))
    
class CancelFriendRequests(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Friend().cancelFriendRequest(self.request.POST['key'].strip())
        self.response.out.write(json.dumps({"response":response}))

class DeleteShout(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().deleteShout(self.request.POST['key'].strip()) 
        self.response.out.write(json.dumps({"response":response}))

class FullSynch(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().fullSynch()
        self.response.out.write(json.dumps({"response":response}))
        
class ShoutHistory(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().shoutHistory(self.request.POST['key'].strip(), 
                                         self.request.POST['item'].strip())
        self.response.out.write(json.dumps({"response":response}))
        
class WhosShoutMobHome(StandardPage):
    @url_inject("web")
    def get(self):
        self.response.out.write(template.render('web/whos_shout_mob.html', self.template_values))
        
class AddShout(webapp2.RequestHandler):
    @url_inject("json")
    def post(self):
        response = Person().addShout(self.request.POST['item'].strip(), 
                                    self.request.POST['date_time'].strip(), 
                                    self.request.POST['key'].strip(), 
                                    self.request.POST['who'].strip(),
                                    self.request.POST['shouts_last_updated'].strip(),
                                    self.request.POST['latt'].strip(),
                                    self.request.POST['long'].strip())
        self.response.out.write(json.dumps({"response":response}))
        
class TestHome(StandardPage):
    @url_inject("web")
    def get(self):
        self.response.out.write(template.render('web/tests.html', 
                                        self.template_values))

app = webapp2.WSGIApplication([('/auth/tests', TestHome),  
                               ('/add_feedback', AddFeedback),
                               ('/auth/update_person', UpdatePerson),
                               ('/auth/check', Check),
                               ('/auth/full_synch', FullSynch),
                               ('/auth/add_shout', AddShout),
                               ('/auth/add_friend', AddFriend),
                               ('/auth/delete_friend', DeleteFriend),
                               ('/auth/edit_friend', EditFriend),
                               ('/auth/history', ShoutHistory),
                               ('/auth/delete_shout', DeleteShout),
                               ('/auth/friend_requests', FriendRequests),
                               ('/auth/accept_friend_requests', AcceptFriendRequests),
                               ('/auth/reject_friend_requests', RejectFriendRequests),
                               ('/auth/cancel_friend_requests', CancelFriendRequests),
                               ('/mob.*', WhosShoutMobHome),
                               ('/.*', WhosShoutMobHome),],
                                     debug=True)
