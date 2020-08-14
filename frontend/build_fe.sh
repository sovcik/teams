#!/bin/sh
echo Building frontend
pushd ./frontend
destFile="../public/javascripts/fe.js"

rm $destFile

cat lib/lib_common.js >> $destFile
cat lib/lib_event.js >> $destFile
cat lib/lib_forms.js >> $destFile
cat lib/lib_invoice.js >> $destFile
cat lib/lib_invorg.js >> $destFile
cat lib/lib_modals.js >> $destFile
cat lib/lib_profile.js >> $destFile
cat lib/lib_program.js >> $destFile
cat lib/lib_team.js >> $destFile

cat src/admin.js >> $destFile
cat src/event.js >> $destFile
cat src/invoice.js >> $destFile
cat src/invorg.js >> $destFile
cat src/profile.js >> $destFile
cat src/program.js >> $destFile
cat src/scripts.js >> $destFile
cat src/signup.js >> $destFile
cat src/team.js >> $destFile
popd
echo Frontend ready