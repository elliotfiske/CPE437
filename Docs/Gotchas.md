#Traps and Gotchas#
This document summarizes common traps/misunderstandings in the various technologies we're using.

##JS##

##NodeJS##
1. Require of modules in current directory still requires "./" prefix, to clarify it's in the current dir and not in node_modules

##Express##
1. Note req.query vs req.params.  Easy to mix the two up.

##MySQL##
1. Pararameters, even if only one, must be in an array.
2. Don't forget to release your connections.

##Postman##
1. Turn on the "interceptor" option, which may in turn require installation of another Chrome app.  This makes Postman record and re-send cookies.  Otherwise, your logins won't work.

2. Clicking Tests brings up a new tests window, with the saved version, each time, **even
if there is already a Tests window, with unsaved version, already showing**.  In general,
be very careful about multiple tabs open on the same test.

3. Setting an appropriate Chrome flag will let you bring up the Chrome console even on
a packaged app like Postman.  The link for this is given in the Postman docs.

4. Stopping a run doesn't work well once the server has errored-out.  Just close the run window instead.

##OpenShift##
1. <Fill in details on environment variables>
2. <JHN Pls fill in details on location of logs>
