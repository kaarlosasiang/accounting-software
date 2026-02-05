#!/bin/bash

cd /Users/kaarlosasiang/Documents/accounting-software/apps/backend

# Fix the single quote issue in payment number strings
perl -i -pe 's/`PAY-\$\{year\}-\$\{sequence\}\.toString\(\)\.padStart\(4, '\''0'\)'`}\;/`PAY-${year}-${sequence.toString().padStart(4, '\''0\'')}`;/g' src/api/v1/modules/payment/paymentService.ts

echo "Fixed single quote issue in payment service"