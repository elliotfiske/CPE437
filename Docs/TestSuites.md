
# Test Suite Descriptions#

A "standard user" is identified by letter only (e.g. user A) but has initial name FirstA LastA, password passwordA and email UserA@domainA.  (Tests may change these after initial registration).

## Suite 1 (supplied)

1. Log in admin and nuke the DB.
2. Relogin as Admin
1. Register user A as a student.
1. Reregister user A.  Should fail due to duplicate Email.
1. Register user B as an admin.  Should fail due to bad role.
1. Register A with empty body.  Should fail due to missing fields.
1. Get A's data.  Should fail due to noLogin.
1. Log in as A.
1. Change As firstName to FirstAV1
1. Log out A.
1. Log in admin@chs.
1. Get A's data.  Confirm FirstAV1 firstName.
1. Get A's Attempts.  Should show none.
1. Add a game MMindF41.
1. Start an attempt for A to MMindF41
1. Quit that attempt.
1. Log out.
1. Relogin as user A.
1. Start another attempt for A on MMindF41
1. Do one step.
1. Get its result, after suitable pause.

## Suite 2 (Suggested)
1. Login as Admin and clear the database
2. Relogin as Admin and POST two Chls MMindF41 and MMindF42.
1. Fetch Chls GET with name qualifier.  Should return one result.
1. Log out
1. Attempt Prss POST without termsAccepted
1. Attempt Prss POST without password.
1. Do Prss POST with termsAccepted and good password, etc.  Should pass.  Save prsID as PrsA.
1. Do Prss POST again with different Email, save prsId as PrsB.
1. Log in as PrsA
1. Attempt to set password to "" without supplying old password.
1. Start an Att on MMindF41 for PrsA.  Save id as PrsAAttA.
1. Quit Att PrsAAttA.  
1. Start a new Att on MMindF41 for PrsA.  Save id as PrsAAttB.
1. Log out.
1. Log in as PrsB
1. Attempt, as PrsB, to do a Step on PrsAAttB.  Should fail.
1. Login as admin and delete Prss/{{prsIdA}}.  
1. GET  Prss/{{prsIdA}} and Prss/{{prsIdA}}/Atts and Atts/{{prsAAttA}}.
1. Re-delete Prss/{{prsIdA}}.  Should fail.

