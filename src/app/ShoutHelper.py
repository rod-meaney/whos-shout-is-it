'''
Created on Feb 3, 2014

@author: roderickmeaney
'''
import logging
class ShoutPair:
    def __init__(self, _name_key, _item):
        self.id = _name_key
        self.item = _item
        self.yours = 0
        self.mine = 0
        self.key = _name_key+"^"+_item
        
    def add_yours(self):
        self.yours = self.yours + 1 
        
    def add_mine(self):
        self.mine = self.mine + 1
        
    def dictTotals(self):
        return {"me":self.mine, "you":self.yours}
    
class ShoutList:
    def __init__(self):
        self.all_shouts = {}
        
    def addShout(self, _name_key, _item, _mine_yours) :
        key = _name_key+"^"+_item
        iou = self.all_shouts.get(key) 
        if iou == None:
            iou = ShoutPair(_name_key, _item)
        if _mine_yours == 1:
            iou.add_mine()
        else:
            iou.add_yours()    
        self.all_shouts[key]=iou
        
    def toDict(self):
        response = {}
        for key in self.all_shouts.keys():
            response[key]=self.all_shouts[key].dictTotals()
        return response