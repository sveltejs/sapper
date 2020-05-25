---
title: Deployment
---

Sapper apps run anywhere that supports Node 8 or higher.

### Deploying to Vercel ([formerly ZEIT Now](https://vercel.com/blog/zeit-is-now-vercel))

We can use a third-party library like [the `vercel-sapper` builder](https://www.npmjs.com/package/vercel-sapper) to deploy our projects to [Vercel]. See [that project's readme](https://github.com/thgh/vercel-sapper#readme) for more details regarding [Vercel] deployments.

### Deploying service workers

Sapper makes the Service Worker file (`service-worker.js`) unique by including a timestamp in the source code
(calculated using `Date.now()`).

In environments where the app is deployed to multiple servers (such as [Vercel]), it is advisable to use a
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

When deploying to [Vercel], you can pass the environment variable into the Vercel CLI tool itself:

```bash
vercel -e SAPPER_TIMESTAMP=$(date +%s%3N)
```

[Vercel]: https://vercel.com/home


## Deploying with Docker

[Docker](https://docs.docker.com/install/) can be used to build an image and run it on your local system. Doing this locally allows testing the build process before building and deploying it on a cloud platform. A Docker image can be built by adding a Dockerfile to your project:

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

- Perform a `sapper` build that uses the devDependencies (like the `svelte` compiler itself) to generate minimal code
- Perform an `npm install --production` that only installs runtime dependencies (like `sirv` and `polka`)
- Aggregate the build artifacts and the runtime dependencies into the final image

The three steps ensure that the final image will only contain the generated code and the runtime dependencies for production. The final image is based upon [mhart/alpine-node](https://hub.docker.com/r/mhart/alpine-node/) which is a small linux image that uses Alpine and Node.


### Docker commands

Commands available to build and run a local Docker image listed below.

```bash
export IMAGE=sapper-image
export CONTAINER=sapper

npm install
# build a docker image
docker build -t $IMAGE .
# show image size (sapper-template is 47.1MB)
docker images $IMAGE --format {{.Size}}
# run docker image locally
docker run --name $CONTAINER -p 3000:3000 -d $IMAGE
# show running containers
docker ps
# show container stats
docker stats
# access the shell
docker exec -it $CONTAINER /bin/sh
# stop the container
docker stop $CONTAINER
# remove the container
docker rm $CONTAINER
# clean up the system
docker system prune
```
