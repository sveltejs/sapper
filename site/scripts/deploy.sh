#!/bin/sh
HEAD=$(git symbolic-ref HEAD)
git symbolic-ref HEAD refs/heads/gh-pages
git reset $HEAD
git rm --cached -rf ..
cd __sapper__/export
files=($(find -type f | cut -c 3-))
for file in ${files[@]}; do hash=$(git hash-object -w $file); git update-index --add --cacheinfo 100644,$hash,$file; done
git commit -m '[build site]'
git symbolic-ref HEAD $HEAD
git reset
git push -f origin gh-pages
