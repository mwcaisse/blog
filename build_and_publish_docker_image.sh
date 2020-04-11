#!/bin/bash

OWNER=mwcaisse
GIT_REPO=blog
IMAGE_NAME=blog
VERSION=1.0
TAG="docker.pkg.github.com/${OWNER}/${GIT_REPO}/${IMAGE_NAME}:${VERSION}"

#build
docker build -t ${TAG} .

#publish
docker push ${TAG}