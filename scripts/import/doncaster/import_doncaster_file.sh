#!/bin/sh

echo Importing doncaster file $1...

cat "$1" > "$1.preprocessed"

../rethinkdb_import.sh "$1.preprocessed" bigchain.doncaster_import --custom-header effective_date,transaction_number,directorate,sercop_service,supplier_classification_1,procurement_classification_1,procurement_classification_2,supplier_name,amount_net