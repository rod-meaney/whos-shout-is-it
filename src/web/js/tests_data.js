var tests={};
x=tests['my details']={};
x["test status"] = "passed";
x["save"] = "Saving name works";
x["default"] = "Default to my details if no name";
x["add friend 01"] = "Cannot without name";
x["add friend 02"] = "Can with name";
x=tests['add friend']={};
x["test status"] = "passed";
x["Add without email 01"] = "Adds and returns to person screen";
x["Add without email 02"] = "Appears on friend list";
x["Add without email validation 01"] = "Prevents if existing friend with same name";
x["Add with email validation 01"] = "Prevents if existing friend with same name";
x["Add with email validation 02"] = "Prevents if existing friend with same email";
x["Add with email validation 03"] = "Prevents if existing request sent";
x["Add with email validation 04"] = "Prevents if existing request awaiting approval";
x["Add with email 01"] = "Validates email correctly";
x["Add with email 02"] = "Adds friend as a request";
x["Add with email 03"] = "Sends an email";
x["Add with email 04"] = "Email data filled in correctly";
x["Add with email 05"] = "Appears on sent of requestor";
x["Add with email 06"] = "Appears on received of requestee";
x["Add with email 07"] = "Appears on friend list";
x=tests['manage friend requests']={};
x["test status"] = "passed";
x["Request tab"] = "Brings down list of sent and received requests";
x["Accept friend request 01"] = "Can accept friend";
x["Accept friend request 02"] = "Converts friend request to sender friend";
x["Accept friend request 03"] = "Creates new friend record of accepter";
x["Accept friend request 04"] = "Friend displays on friend list";
x["Cancel sent friend request 01"] = "Convert friend request to friend";
x["Cancel sent friend request 02"] = "Request no longer shows on sent of requestor or received of requestee";
x["Reject received friend request 01"] = "Convert friend request to friend";
x["Reject received friend request 02"] = "Request no longer shows on sent of requestor or received of requestee";
x["Back button 01"] = "Accept already accepted request";
x["Back button 02"] = "Reject already accepted request";
x["Back button 03"] = "Accept already rejected request";
x["Back button 04"] = "Reject already rejected request";
x["Notification 01"] = "..Correct number for friend requets shows on person add page";
x["Notification 02"] = "..Subtract when accepting";
x["Notification 03"] = "..Add if it happens in the background";
x["Notification 04"] = "..Picks up adds in shout";
x["Notification 05"] = "..Button does not show if no requests";
x=tests['initial load']={};
x["test status"] = "passed";
x["List of friends"] = "List of friends extracted and displayed";
x["Synchronise shouts not locally"] = "All shouts after local latest update will need updating";
x=tests['selected person']={};
x["test status"] = "passed";
x["Load data"] = "Load data from local store";
x["Show screen 01"] = "New item";
x["Show screen 02"] = "Existing items";
x["Show screen 03"] = "Existing items count";
x["Show screen 04"] = "Existing items sort - highest at top";
x["..Show screen 05"] = "Existing items not currently shouting with friend";
x["New item 01"] = "Add new item";
x["New item 02"] = "Validate new item text";
x["New item 03"] = "Validate new item does not already exist";
x["New item 04"] = "Adds at top of current list";
x=tests['new shout']={};
x["test status"] = "developing";
x["Show screen 01"] = "Show item and person";
x["Show screen 02"] = "Show graph of history";
x["Show screen 03"] = "Friends name appears on their shout button";
x["My shout 01"] = "Adds shout to me (javascript object and local datastore)";
x["My shout 02"] = "If friend adds shout to them";
x["Their shout 01"] = "Adds shout to me (javascript object and local datastore)";
x["Their shout 02"] = "If friend adds shout to them";
x["Save data locally"] = "Saves data to local store";
x["Test Varaition 01"] = "Not a friend";
x["Test Varaition 02"] = "Is a friend";
x["Test Varaition 03a"] = "Is still at friend request stage (requester)";
x["Test Varaition 03b"] = "Is still at friend request stage (requestee)";
x["Test Varaition 01"] = "Not a friend";
x["Retrieve history"] = "History is retreived and displayed";
x["..Delete history"] = "Delete single item of history";
x["View map from history"] = "If a location for an item is available - show the google map if requested";
x=tests['Synching']={};
x["test status"] = "passed";
x["On load none down"] = "Bring down all shouts";
x["On load delta"] = "Bring down all unloaded shouts for Variations below";
x["Adding shout delta"] = "Bring down all unloaded shouts for Variations below";
x["Variation 01"] = "item exists for person";
x["Variation 02"] = "item does not exist for person";
x["Variation 03"] = "item does not exist at all";
x["Variation 04"] = "same item added at same time by friend (should double)";
x=tests['Item listing']={};
x["test status"] = "passed";
x["Item screen"] = "Shows all items";
x["People listing screen"] = "Shows item with people count";
x["Shout"] = "Move to the shout screen - will then be testing existing functionality";
x=tests['Location services']={};
x["test status"] = "passed";
x["turn on services"] = "Switch and local trigger works";
x["commit data 01"] = "Commits to shout";
x["commit data 02"] = "Does not commit to friends shout";
x=tests['Help']={};
x["test status"] = "tested";
x["FAQ's"] = "Ensure change does not break";
x["Planned enhancements"] = "Ensure change does not break";
x["Releases"] = "Ensure change does not break";
x=tests['manage friends']={};
x["test status"] = "passed";
x["Change friend name"] = "Change their name then refresh the list (by relaoding page)";
x=tests['delete friends']={};
x["test status"] = "future";
x["Delete friend 01"] = "No longer shows on list";
x["Delete friend 02"] = "Shouts are marked as deleted (and no longer show)";
x["Delete friend 03"] = "Try adding again - re-enables existing deleted account - LAST THING";
x["Delete friend 04"] = "Friend who has been deleted adds shout (no shouts for deleted friend)";
x["Delete friend 05"] = "Migrate all friends to have is deleted field";
x=tests['Groups']={};
x["test status"] = "future";
x["Create local group"] = "future";
x["Add members"] = "future";
x["Remove members"] = "future";
x["Do shout"] = "future";
x=tests['statistics']={};
x["test status"] = "future";
x["By friends"] = "future";
x["By items"] = "future";
x["Delete friend"] = "future";