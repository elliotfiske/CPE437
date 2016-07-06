# Node
Version 4.4.6 as of time of writing is the current LTS(Long Term Stable) and
as such is ther version we will use for this course.
#### Linux
For linux you can choose to use your package manager or download from source.
the source code can be found at [www.nodejs.org](https://nodejs.org/en/)


use your package manager to get node/NPM for ubunut this is
`sudo apt-get install nodejs `
for other distros use your pacakage manager and look for a package named node
or nodejs
After installing nodejs you also want to install npm using the same method
`sudo apt-get install npm`

## NPM Packages

once npm is installed open command prompt for windows or terminal for mac
and linux. navigate to the root level of the project and run the command
`npm install`. This will install all packages listed as dependencies by the
package.json file into the node_modules folder.

To run the app type either node main.js or nodejs main.js depending on the
name of the node executable on your system

#### Windows Or Mac

navigate to [www.nodejs.org](https://nodejs.org/en/) download the appropriate
installer and run it. This includes npm so you have everything you need for
both platforms


# MySQL

#### Windows
Download the installer from
[dev.mysql.com](https://dev.mysql.com/downloads/installer/)

This comes with the option to install everything needed for this course
including mysql-server, mysql-client, and workbench (workbench is not needed,
however many people prefer using a GUI over command line client).

Also note that you do not need to sign up for an account, there is a
"No thanks, just start my download" link.

From there choose the pieces that you would like to install, you need at least
the server and probably the workbench. During this installation, you will be
asked to pick a password for the database root account. Remember this password,
It is the only way to edit the database once installed without deleting it.

This should also install a modified command prompt if you would like to use that,
search your installed programs for MySQL command line client, otherwise use
the workbench to access your database.

#### Linux

This one depends a bit on your choice of distribution.

###### Ubuntu
The following commands should suffice to install what you need

```
sudo apt-get install mysql-server
sudo apt-get install mysql-client
```
or
```
sudo apt-get install mysql-server-5.7
sudo apt-get install mysql-client-5.7
```

###### Other

either download the generic Linux from
[dev.mysql.com](http://dev.mysql.com/downloads/mysql/)
Or find the mysql package in your package manager

#### Mac

navigate to [dev.mysql.com](http://dev.mysql.com/downloads/mysql/) and choose
Mac OS X. from there install the server (The mysql pkg file) and the prefPane
from the dmg file. If it gives you a temporary password, make sure to note it.

You should also install the workbench found here
[dev.mysql.com/workbench](http://dev.mysql.com/downloads/workbench/)

If you want the command line interface you should navigate to the mysql install
directory if it was not installed somewhere it can be found from the path
then execute the mysql executable to run the client.

##

After installing mysql, you should load the CHSdb database by running the Init.sql
file from the Database folder of the application, you should also add an Admin
with the createAdmin.sql file. 

# Postman

This one is a chrome app, navigate to
[www.getpostman.com/](https://www.getpostman.com/)

#### Windows and Linux

Install the chrome extension linked from the home page. You will also once that
is installed, need to install the postman intercepter plugin. This allows
postman to read cookies sent from the server.

#### Mac

I am not sure if it is better to try and use the chrome extension or the mac
install link on their main page. I would try the mac install and inform us of
any deficiencies it may have.

#### all

Once you have postman installed, open it and create a new environment with the
menu in the top right. In this environment create a field named `url` and
give it the value `localhost:3000` if you are testing locally or the url
if you are testing on a server. after that make sure to use that environment.
Finally navigate to the Tests folder in the example code. Here you should find
`Suite 1.postman.json`. Import this file into postman to create the collection.
This collection shows basic testing against the server.

# OpenShift

go to
 [openshift.com](https://openshift.redhat.com/app/login?then=%2Fapp%2Fconsole)
and then make an account with openshift. From there add an application, chose
Node latest for the application type. Do not change the region or the scaling,
leave them as no scaling.

Once you create that you should add the mysql cartridge, This will add a mysql
database to your app.

If you have not used ssh keys to login to servers before you will need to
make an ssh key. to do this you need to run `ssh-keygen` from the terminal in
linux and mac or git-bash on windows. Follow the instructions provided by
ssh-keygen then copy your public key ( located at .ssh/id_rsa.pub) into the ssh
key box the website.

After that pull the sample app given to you down, copy the example server
given by us into the repository provided by openshift (not the .git folder).
From there it is a simple manner of doing a push to the repository. This
should trigger a deploy of your app (It will tell you about this when you
push)
