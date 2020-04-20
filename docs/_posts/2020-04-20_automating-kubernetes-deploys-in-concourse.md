---
title: Automating Kubernetes Deploys in Concourse
date: 2020-04-20
tags: 
    - kubernetes
    - concourse
    - automation
    - devops
    - docker
author: Mitchell Caisse
---

## Introduction
This article describes how to automate deployments to Kubernetes using Concourse.

## Steps

* Build and publish docker image
    * Build the docker image
    * Push docker image to a repository
* Deploy
    * K8S Configuration
    * Populate K8S Configuration with tag version
    * Push to K8S
    * Copy server configuration to git repo
    
## Initial Configuration

First we'll define the common resources that we will be using throughout. Such as the source repo, pipeline repo, and
the version. I use GitHub to store the source repo, a separate repo to store the pipeline configuration / tasks, and
a semver stored on S3 to keep track of versioning.

```yaml
resources:
  - name: src-master
    type: git
    icon: github-circle
    source:
      uri: git@github.com:mwcaisse/blog.git
      branch: master
      private_key: ((git.private-key))

  - name: pipeline-repo
    type: git
    icon: github-circle
    source:
      uri: ((pipeline-repo.uri))
      branch: ((pipeline-repo.branch))
      private_key: ((git.private-key))

  - name: version
    type: semver
    icon: trending-up
    source:
      driver: s3
      initial_version: 1.0.1
      endpoint: ((s3.host))
      region_name: ((s3.region_name))
      access_key_id: ((s3.key-id))
      secret_access_key: ((s3.secret-key))
      bucket: ((s3.version-bucket))
      key: blog/version
```
    
## Build the Docker Image

Now that we have the resource for our source repo defined, we can go ahead and start building the docker image. This assumes
that the Dockerfile is in the root of the source repository.

The first thing that we will do is pull down the source repository and mark it as a trigger for the job.
```yaml
jobs:
  - name: build-and-publish
    plan:
      - get: src-master
        trigger: true     
```

Now time for the fun part, defining the step that builds the docker image. I used [`vito/oci-build-task`](https://github.com/vito/oci-build-task) to build the image
as that is now the recommended approach to building containers on concourse over using the `docker-image` resource.

```yaml
  - task: build
    privileged: true
    config:
      platform: linux
      image_resource:
        type: registry-image
        source:
          repository: vito/oci-build-task
      inputs:
        - name: src-master
          path: .
      outputs:
        - name: image
      run:
        path: build
```

## Publish Docker Image
We have the docker image built now, but it is not much use unless we save it somewhere. Let's push it up to GitLab's
docker registry.

We'll need to tag the image with a version number before pushing it up, let's pull in the version that we defined before
```yaml
  - name: build-and-publish
    plan:
      - get: src-master
        trigger: true    

      - get: version
        trigger: false
        params:
          bump: patch
```

We'll also need to define the resource for the image
```yaml
resources:
  - name: blog-image
    type: registry-image
    icon: docker
    source:
      repository: registry.gitlab.com/((gitlab.username))/application-images/blog
      username: ((gitlab.username))
      password: ((gitlab.access-token))
```

The task to upload the image is relatively simple. `vito/oci-builder-task` outputs the built image into a tar file
in the image directory, `image/image.tar`, we will use that path in our push task.
```yaml
  - put: blog-image
    params:
      image: image/image.tar
      additional_tags: version/number
```

Now the image is built and pushed up to a docker registry, it is all set to be deployed to kubernetes.

## Deploy image to Kubernetes