#!/usr/bin/env bash

cd /var/www/html/frontend
npm run build
cd /var/www/html/server
npm run build