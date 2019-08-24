---
title: Deployment
---

Sapper apps run anywhere that supports Node 8 or higher.


### Deploying to Now

> This section relates to Now 1, not Now 2

We can very easily deploy our apps to [Now][]:

```bash
npm install -g now
now
```

This will upload the source code to Now, whereupon it will do `npm run build` and `npm start` and give you a URL for the deployed app.

For other hosting environments, you may need to do `npm run build` yourself.

### Deploying service workers

Sapper makes the Service Worker file (`service-worker.js`) unique by including a timestamp in the source code
(calculated using `Date.now()`).

In environments where the app is deployed to multiple servers (such as [Now][]), it is advisable to use a
consistent timestamp for all deployments. Otherwise, users may run into issues where the Service Worker
updates unexpectedly because the app hits server 1, then server 2, and they have slightly different timestamps.

To override Sapper's timestamp, you can use an environment variable (e.g. `SAPPER_TIMESTAMP`) and then modify
the `service-worker.js`:

```js
const timestamp = process.env.SAPPER_TIMESTAMP; // instead of `import { timestamp }`

const ASSETS = `cache${timestamp}`;

export default {
	/* ... */
	plugins: [
		/* ... */
		replace({
			/* ... */
			'process.env.SAPPER_TIMESTAMP': process.env.SAPPER_TIMESTAMP || Date.now()
		})
	]
}
```

Then you can set it using the environment variable, e.g.:

```bash
SAPPER_TIMESTAMP=$(date +%s%3N) npm run build
```

When deploying to [Now][], you can pass the environment variable into Now itself:

```bash
now -e SAPPER_TIMESTAMP=$(date +%s%3N)
```

[Now]: https://zeit.co/now


## Deploying to App Engine

[Google App Engine](https://cloud.google.com/appengine/) is a fully managed serverless platform. The app engine will run the dynamic server so its not necessary to perform `npm run export`. Before deploying you need to add an `app.yaml` file to your project, that specifies the required node runtime:

```
# app.yaml
runtime: nodejs10
```

A [custom build step](https://cloud.google.com/appengine/docs/standard/nodejs/running-custom-build-step) can be run by adding `"gcp-build": "run-p build"` as a `scripts` entry to your `package.json` scripts. This ensures that the build step will be performed before the application starts. Now you can deploy using the `gcloud app deploy` command.


## Deploying to Docker

[Docker](https://docs.docker.com/install/) can be used to build an image and run it on your local system. Doing this locally allows testing the build process before building and deploying it on a cloud platform. The Docker image can be build by adding a `Dockerfile` into your project:

```Dockerfile
# Dockerfile
FROM mhart/alpine-node:12 as build

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM mhart/alpine-node:12 as prod

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM mhart/alpine-node:slim-12

WORKDIR /app
COPY --from=build /app/__sapper__/build __sapper__/build
COPY --from=build /app/static static
COPY --from=prod /app .

CMD ["node", "__sapper__/build"]
```

This Dockerfile is a [multi-stage build](https://docs.docker.com/develop/develop-images/multistage-build/) that performs three steps:

- Perform a Sapper build with development packages
- Perform a npm install with only production packages
- Aggregate the build artefacts and the production packages into a single image

The three steps ensure that you have a very small image that only contains the necessary files for running Sapper in production. The image is based upon [mhart/alpine-node](https://hub.docker.com/r/mhart/alpine-node/) that is a small linux image that uses Alpine and Node.


### Docker commands

Commands available to build and run a local Docker image listed below. The names `sapper-image` and `sapper-container` are just examples that you can replace with something more appropiate.

```bash
# build a docker image
docker build -t sapper-image .
# run docker image locally
docker run --name sapper-container -p 3000:3000 -d sapper-image
# show running containers
docker ps
# show container stats
docker stats
# access the shell
docker exec -it sapper-container /bin/sh
# stop the container
docker stop sapper-container
# remove the container
docker rm sapper-container
# clean up the system
docker system prune
```


## Deploying to Google Cloud Run

Google Cloud allows building and running Docker images on the Google Cloud. This also allows adding custom domains and other resources like PostgreSQL databases. The `Dockerfile` from the previous section is required, but you don't need to install Docker locally. Add a `.gcloudingore` file (full [reference](https://cloud.google.com/sdk/gcloud/reference/topic/gcloudignore) that includes the same content as the `.gitignore` file:

```
# .gcloudignore
#!include:.gitignore
```


### Google Cloud commands

Before deploying you need to install the [Google Cloud SDK](https://cloud.google.com/sdk/install) and [initialize](https://cloud.google.com/sdk/docs/initializing) it. In the [Google Cloud Platform](https://console.cloud.google.com) you need to create a project and this project will have an Project ID that you need to use instead of `$PROJECT_ID` in the commands below. The names `sapper-image` and `sapper-service` are just examples that you can replace with something more appropiate.

```bash
# build the image
gcloud builds submit --tag gcr.io/$PROJECT_ID/sapper-image
# deploy the image
gcloud beta run deploy sapper-service --image gcr.io/$PROJECT_ID/sapper-image --platform managed --allow-unauthenticated
```
