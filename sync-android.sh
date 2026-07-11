#!/bin/sh
# Після будь-якої зміни index.html запусти цей скрипт,
# щоб оновити копію гри всередині Android-проєкту.
cp index.html android/app/src/main/assets/index.html
echo "OK: index.html -> android/app/src/main/assets/index.html"
